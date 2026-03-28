from __future__ import annotations

import json
import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import delete, select, text
from sqlalchemy.exc import IntegrityError

from pgdoc.errors import DuplicateKeyError
from sqlalchemy.ext.asyncio import AsyncSession

from pgdoc.match_update import apply_update, match_document, project_document
from pgdoc.models import DocStore
from pgdoc.session import db_session_ctx



class UpdateResult:
    def __init__(self, modified_count: int = 0):
        self.modified_count = modified_count


class InsertOneResult:
    def __init__(self, inserted_id: str):
        self.inserted_id = inserted_id


class DeleteResult:
    def __init__(self, deleted_count: int = 0):
        self.deleted_count = deleted_count


def _session() -> AsyncSession:
    s = db_session_ctx.get()
    if s is None:
        raise RuntimeError("No database session (middleware or worker_session_scope missing)")
    return s


class QueryCursor:
    def __init__(self, collection_name: str, filt: dict, projection: Optional[dict]):
        self.collection_name = collection_name
        self.filt = filt or {}
        self.projection = projection
        self._sort_key: Optional[str] = None
        self._sort_dir = 1
        self._lim: Optional[int] = None

    def sort(self, key: str, direction: int):
        self._sort_key = key
        self._sort_dir = direction
        return self

    def limit(self, n: int):
        self._lim = n
        return self

    async def to_list(self, length: Optional[int] = None) -> List[dict]:
        lim = length if length is not None else self._lim
        session = _session()
        stmt = select(DocStore).where(DocStore.collection == self.collection_name)
        result = await session.execute(stmt)
        rows = result.scalars().all()
        docs = []
        for row in rows:
            d = dict(row.data)
            if match_document(d, self.filt):
                docs.append(project_document(d, self.projection))
        if self._sort_key:
            rev = self._sort_dir < 0

            def sk(x):
                v = x.get(self._sort_key)
                if v is None:
                    return ""
                if isinstance(v, (int, float)):
                    return v
                return str(v)

            try:
                docs.sort(key=sk, reverse=rev)
            except TypeError:
                docs.sort(key=lambda x: str(sk(x)), reverse=rev)
        if lim is not None:
            docs = docs[:lim]
        return docs


class AggregateCursor:
    def __init__(self, collection_name: str, pipeline: list):
        self.collection_name = collection_name
        self.pipeline = pipeline

    async def to_list(self, max_len: int = 100) -> List[dict]:
        session = _session()
        # Leaderboard: redemptions counts per user
        if len(self.pipeline) >= 2 and "$group" in self.pipeline[1]:
            grp = self.pipeline[1]["$group"]
            if grp.get("_id") == "$user_id" and isinstance(grp.get("count"), dict) and "$sum" in grp["count"]:
                match = self.pipeline[0].get("$match", {})
                uids = match.get("user_id", {}).get("$in", [])
                if not uids:
                    return []
                q = text(
                    """
                    SELECT data->>'user_id' AS _id, COUNT(*)::int AS count
                    FROM doc_store
                    WHERE collection = 'redemptions'
                      AND data->>'user_id' = ANY(:uids)
                    GROUP BY data->>'user_id'
                    """
                )
                res = await session.execute(q, {"uids": uids})
                return [{"_id": r[0], "count": r[1]} for r in res.fetchall() if r[0]]

        # Latest ledger entry per user
        if len(self.pipeline) >= 3 and "$group" in self.pipeline[2]:
            grp = self.pipeline[2]["$group"]
            if grp.get("_id") == "$user_id" and "entry" in grp:
                match = self.pipeline[0].get("$match", {})
                uids = match.get("user_id", {}).get("$in", [])
                if not uids:
                    return []
                q = text(
                    """
                    SELECT DISTINCT ON (data->>'user_id') data
                    FROM doc_store
                    WHERE collection = 'points_ledger'
                      AND data->>'user_id' = ANY(:uids)
                    ORDER BY data->>'user_id', (data->>'created_at') DESC NULLS LAST
                    """
                )
                res = await session.execute(q, {"uids": uids})
                out = []
                for (raw,) in res.fetchall():
                    data = raw if isinstance(raw, dict) else json.loads(raw)
                    uid = data.get("user_id")
                    out.append({"_id": uid, "entry": data})
                return out

        return []


class Collection:
    def __init__(self, name: str):
        self.name = name

    def find(self, filt: Optional[dict] = None, projection: Optional[dict] = None) -> QueryCursor:
        return QueryCursor(self.name, filt or {}, projection)

    async def find_one(
        self, filt: Optional[dict] = None, projection: Optional[dict] = None
    ) -> Optional[dict]:
        filt = filt or {}
        session = _session()
        if "id" in filt and len(filt) <= 4:
            doc_id = filt["id"]
            if not isinstance(doc_id, dict):
                row = await session.get(DocStore, {"collection": self.name, "doc_id": str(doc_id)})
                if row:
                    d = dict(row.data)
                    if match_document(d, filt):
                        return project_document(d, projection)
                return None

        stmt = select(DocStore).where(DocStore.collection == self.name)
        result = await session.execute(stmt)
        for row in result.scalars().all():
            d = dict(row.data)
            if match_document(d, filt):
                return project_document(d, projection)
        return None

    async def insert_one(self, doc: dict) -> InsertOneResult:
        session = _session()
        d = dict(doc)
        doc_id = str(d.get("id") or uuid.uuid4())
        d["id"] = doc_id
        row = DocStore(collection=self.name, doc_id=doc_id, data=d)
        session.add(row)
        try:
            await session.flush()
        except IntegrityError as e:
            raise DuplicateKeyError(str(e)) from e
        return InsertOneResult(doc_id)

    async def replace_one(self, filt: dict, doc: dict, upsert: bool = False):
        """Used rarely; implemented via delete+insert for upsert paths."""
        session = _session()
        existing = await self.find_one(filt)
        d = dict(doc)
        doc_id = str(d.get("id") or (existing or {}).get("id") or uuid.uuid4())
        d["id"] = doc_id
        if existing:
            pk = {"collection": self.name, "doc_id": str(existing["id"])}
            row = await session.get(DocStore, pk)
            if row:
                row.data = d
                row.doc_id = doc_id
                await session.flush()
            return UpdateResult(1)
        if upsert:
            session.add(DocStore(collection=self.name, doc_id=doc_id, data=d))
            await session.flush()
            return UpdateResult(1)
        return UpdateResult(0)

    async def update_one(
        self,
        filt: dict,
        update: dict,
        upsert: bool = False,
    ) -> UpdateResult:
        session = _session()
        stmt = select(DocStore).where(DocStore.collection == self.name)
        result = await session.execute(stmt)
        for row in result.scalars().all():
            d = dict(row.data)
            if not match_document(d, filt):
                continue
            new_data = apply_update(d, update)
            new_id = str(new_data.get("id", row.doc_id))
            if new_id != row.doc_id:
                await session.delete(row)
                await session.flush()
                session.add(DocStore(collection=self.name, doc_id=new_id, data=new_data))
            else:
                row.data = new_data
            await session.flush()
            return UpdateResult(1)
        if upsert:
            base = {k: v for k, v in filt.items() if not isinstance(v, dict)}
            merged = apply_update(base, update)
            doc_id = str(merged.get("id") or uuid.uuid4())
            merged["id"] = doc_id
            session.add(DocStore(collection=self.name, doc_id=doc_id, data=merged))
            await session.flush()
            return UpdateResult(1)
        return UpdateResult(0)

    async def delete_one(self, filt: dict) -> DeleteResult:
        session = _session()
        stmt = select(DocStore).where(DocStore.collection == self.name)
        result = await session.execute(stmt)
        for row in result.scalars().all():
            if match_document(dict(row.data), filt):
                await session.delete(row)
                await session.flush()
                return DeleteResult(1)
        return DeleteResult(0)

    async def delete_many(self, filt: dict) -> DeleteResult:
        session = _session()
        if not filt:
            r = await session.execute(
                delete(DocStore).where(DocStore.collection == self.name)
            )
            await session.flush()
            return DeleteResult(r.rowcount or 0)
        stmt = select(DocStore).where(DocStore.collection == self.name)
        result = await session.execute(stmt)
        n = 0
        for row in list(result.scalars().all()):
            if match_document(dict(row.data), filt):
                await session.delete(row)
                n += 1
        await session.flush()
        return DeleteResult(n)

    async def count_documents(self, filt: Optional[dict] = None) -> int:
        docs = await self.find(filt or {}).to_list(10_000)
        return len(docs)

    async def find_one_and_update(
        self,
        filt: dict,
        update: dict,
        projection: Optional[dict] = None,
        return_document: Any = None,
        **kwargs,
    ) -> Optional[dict]:
        session = _session()
        stmt = select(DocStore).where(DocStore.collection == self.name)
        result = await session.execute(stmt)
        from pgdoc.constants import ReturnDocument as RD

        after = return_document == RD.AFTER or return_document == 1
        for row in result.scalars().all():
            d = dict(row.data)
            if not match_document(d, filt):
                continue
            before = dict(d)
            new_data = apply_update(d, update)
            new_id = str(new_data.get("id", row.doc_id))
            if new_id != row.doc_id:
                await session.delete(row)
                await session.flush()
                session.add(DocStore(collection=self.name, doc_id=new_id, data=new_data))
            else:
                row.data = new_data
            await session.flush()
            out = new_data if after else before
            return project_document(out, projection)
        return None

    def aggregate(self, pipeline: list) -> AggregateCursor:
        return AggregateCursor(self.name, pipeline)
