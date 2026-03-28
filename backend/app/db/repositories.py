"""Repository layer — typed, SQL-backed replacements for pgdoc Collection methods."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Sequence

from sqlalchemy import delete, func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from pgdoc.errors import DuplicateKeyError
from pgdoc.session import db_session_ctx

from app.models import (
    CatalogProductModel,
    ChatMessageModel,
    CouponModel,
    DynamicCouponConfigModel,
    DynamicCouponInventoryModel,
    DynamicCouponRequestModel,
    EmailIngestLogModel,
    EmailIngestProcessedModel,
    LeadModel,
    PartnerCouponRequestModel,
    PartnerModel,
    PartnerOrderModel,
    PartnerSurveyModel,
    PointsLedgerModel,
    PurchaseModel,
    RedemptionModel,
    ReferralTransactionModel,
    SignupOtpModel,
    UserDynamicCouponUnlockModel,
    UserFavoriteStoreModel,
    UserModel,
    UserSurveyModel,
    ZohoMailTokenModel,
)


def _session() -> AsyncSession:
    s = db_session_ctx.get()
    if s is None:
        raise RuntimeError("No database session (middleware or worker_session_scope missing)")
    return s


def _parse_dt(val: Any) -> datetime | None:
    """Coerce ISO-format strings to datetime for asyncpg DateTime columns."""
    if val is None or isinstance(val, datetime):
        return val
    try:
        return datetime.fromisoformat(str(val).replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return val


def _coerce_for_model(model_cls: type, data: dict) -> dict:
    """Convert ISO strings → datetime for any DateTime column in the model, and strip unknown keys."""
    from sqlalchemy import inspect as sa_inspect
    mapper = sa_inspect(model_cls)
    col_keys = {c.key for c in mapper.column_attrs}
    out = {}
    for key, value in data.items():
        if key not in col_keys:
            continue
        col = mapper.columns[key]
        col_type = str(col.type).upper()
        if ("DATETIME" in col_type or "TIMESTAMP" in col_type) and isinstance(value, str):
            value = _parse_dt(value)
        out[key] = value
    return out


def _prep_insert(model_cls: type, doc: dict) -> tuple[str, dict]:
    """Extract id and coerce fields for an insert. Returns (doc_id, kwargs)."""
    doc_id = doc.get("id") or str(uuid.uuid4())
    fields = _coerce_for_model(model_cls, {k: v for k, v in doc.items() if k != "id"})
    return doc_id, fields


def _coerce_update_fields(model_cls: type, fields: dict) -> dict:
    """Coerce values for an update — only datetime conversion, no key filtering."""
    from sqlalchemy import inspect as sa_inspect
    mapper = sa_inspect(model_cls)
    col_keys = {c.key for c in mapper.column_attrs}
    out = {}
    for key, value in fields.items():
        if key in col_keys:
            col = mapper.columns[key]
            col_type = str(col.type).upper()
            if ("DATETIME" in col_type or "TIMESTAMP" in col_type) and isinstance(value, str):
                value = _parse_dt(value)
        out[key] = value
    return out


class _DeleteResult:
    def __init__(self, count: int = 0):
        self.deleted_count = count


class _UpdateResult:
    def __init__(self, count: int = 0):
        self.matched_count = count
        self.modified_count = count


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
class UserRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def find_one(self, **kwargs: Any) -> Optional[dict]:
        stmt = select(UserModel)
        for k, v in kwargs.items():
            stmt = stmt.where(getattr(UserModel, k) == v)
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        return row.to_dict() if row else None

    async def find_one_model(self, **kwargs: Any) -> Optional[UserModel]:
        stmt = select(UserModel)
        for k, v in kwargs.items():
            stmt = stmt.where(getattr(UserModel, k) == v)
        return (await self._s.execute(stmt)).scalar_one_or_none()

    async def get_by_id(self, user_id: str) -> Optional[dict]:
        row = await self._s.get(UserModel, user_id)
        return row.to_dict() if row else None

    async def get_by_email(self, email: str) -> Optional[dict]:
        return await self.find_one(email=email)

    async def get_by_email_case_insensitive(self, email: str) -> Optional[dict]:
        stmt = select(UserModel).where(func.lower(UserModel.email) == email.lower())
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        return row.to_dict() if row else None

    async def get_by_username(self, username: str) -> Optional[dict]:
        return await self.find_one(username=username)

    async def get_by_lynkr_email(self, lynkr_email: str) -> Optional[dict]:
        return await self.find_one(lynkr_email=lynkr_email)

    async def get_by_partner_id(self, partner_id: str) -> Optional[dict]:
        return await self.find_one(partner_id=partner_id)

    async def get_by_verification_token(self, token: str) -> Optional[dict]:
        return await self.find_one(verification_token=token)

    async def get_by_referral_code(self, code: str) -> Optional[dict]:
        return await self.find_one(referral_code=code)

    async def referral_code_exists(self, code: str) -> bool:
        stmt = select(UserModel.id).where(UserModel.referral_code == code)
        return (await self._s.execute(stmt)).scalar_one_or_none() is not None

    async def username_exists(self, username: str, exclude_id: Optional[str] = None) -> bool:
        stmt = select(UserModel.id).where(UserModel.username == username)
        if exclude_id:
            stmt = stmt.where(UserModel.id != exclude_id)
        return (await self._s.execute(stmt)).scalar_one_or_none() is not None

    async def username_or_lynkr_email_exists(self, username: str, lynkr_email: str) -> bool:
        from sqlalchemy import or_
        stmt = select(UserModel.id).where(
            or_(UserModel.username == username, UserModel.lynkr_email == lynkr_email)
        )
        return (await self._s.execute(stmt)).scalar_one_or_none() is not None

    async def insert_one(self, doc: dict) -> str:
        doc_id, kwargs = _prep_insert(UserModel, doc)
        row = UserModel(id=doc_id, **kwargs)
        self._s.add(row)
        try:
            await self._s.flush()
        except IntegrityError as e:
            await self._s.rollback()
            raise DuplicateKeyError(str(e)) from e
        return doc_id

    async def update_one(self, user_id: str, **fields: Any) -> _UpdateResult:
        row = await self._s.get(UserModel, user_id)
        if not row:
            return _UpdateResult(0)
        for k, v in _coerce_update_fields(UserModel, fields).items():
            setattr(row, k, v)
        await self._s.flush()
        return _UpdateResult(1)

    async def update_by_filter(self, filt: Dict[str, Any], **fields: Any) -> _UpdateResult:
        stmt = select(UserModel)
        for k, v in filt.items():
            stmt = stmt.where(getattr(UserModel, k) == v)
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        if not row:
            return _UpdateResult(0)
        for k, v in _coerce_update_fields(UserModel, fields).items():
            setattr(row, k, v)
        await self._s.flush()
        return _UpdateResult(1)

    async def find_one_and_update(self, filt: Dict[str, Any], updates: Dict[str, Any]) -> Optional[dict]:
        """Atomically find+update, returning the AFTER document."""
        stmt = select(UserModel)
        for k, v in filt.items():
            stmt = stmt.where(getattr(UserModel, k) == v)
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        if not row:
            return None
        for k, v in _coerce_update_fields(UserModel, updates).items():
            setattr(row, k, v)
        await self._s.flush()
        return row.to_dict()

    async def delete_one(self, user_id: str) -> _DeleteResult:
        row = await self._s.get(UserModel, user_id)
        if row:
            await self._s.delete(row)
            await self._s.flush()
            return _DeleteResult(1)
        return _DeleteResult(0)

    async def find_by_role(self, role: str, limit: int = 1000, exclude_fields: Optional[set] = None) -> List[dict]:
        stmt = select(UserModel).where(UserModel.role == role).limit(limit)
        rows = (await self._s.execute(stmt)).scalars().all()
        users = [r.to_dict() for r in rows]
        if exclude_fields:
            users = [{k: v for k, v in u.items() if k not in exclude_fields} for u in users]
        return users

    async def find_by_ids(self, ids: List[str], fields: Optional[List[str]] = None) -> List[dict]:
        if not ids:
            return []
        stmt = select(UserModel).where(UserModel.id.in_(ids))
        rows = (await self._s.execute(stmt)).scalars().all()
        if fields:
            return [{k: r.to_dict()[k] for k in fields if k in r.to_dict()} for r in rows]
        return [r.to_dict() for r in rows]

    async def top_by_points(self, role: str, limit: int = 20, fields: Optional[List[str]] = None) -> List[dict]:
        stmt = (
            select(UserModel)
            .where(UserModel.role == role)
            .order_by(UserModel.points.desc())
            .limit(limit)
        )
        rows = (await self._s.execute(stmt)).scalars().all()
        users = [r.to_dict() for r in rows]
        if fields:
            users = [{k: v for k, v in u.items() if k in fields} for u in users]
        return users

    async def find_partner_user_by_email(self, email: str) -> Optional[dict]:
        stmt = select(UserModel).where(UserModel.email == email, UserModel.role == "PARTNER")
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        return row.to_dict() if row else None

    async def find_partner_user_by_email_ci(self, email: str) -> Optional[dict]:
        stmt = select(UserModel).where(func.lower(UserModel.email) == email.lower(), UserModel.role == "PARTNER")
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        return row.to_dict() if row else None


# ---------------------------------------------------------------------------
# Partners
# ---------------------------------------------------------------------------
class PartnerRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def find_one(self, **kwargs: Any) -> Optional[dict]:
        stmt = select(PartnerModel)
        for k, v in kwargs.items():
            stmt = stmt.where(getattr(PartnerModel, k) == v)
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        return row.to_dict() if row else None

    async def get_by_id(self, pid: str, exclude_fields: Optional[set] = None) -> Optional[dict]:
        row = await self._s.get(PartnerModel, pid)
        if not row:
            return None
        d = row.to_dict()
        if exclude_fields:
            d = {k: v for k, v in d.items() if k not in exclude_fields}
        return d

    async def get_by_contact_email_ci(self, email: str) -> Optional[dict]:
        stmt = select(PartnerModel).where(func.lower(PartnerModel.contact_email) == email.lower())
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        return row.to_dict() if row else None

    async def insert_one(self, doc: dict) -> str:
        doc_id, kwargs = _prep_insert(PartnerModel, doc)
        row = PartnerModel(id=doc_id, **kwargs)
        self._s.add(row)
        try:
            await self._s.flush()
        except IntegrityError as e:
            await self._s.rollback()
            raise DuplicateKeyError(str(e)) from e
        return doc_id

    async def update_one(self, pid: str, **fields: Any) -> _UpdateResult:
        row = await self._s.get(PartnerModel, pid)
        if not row:
            return _UpdateResult(0)
        for k, v in _coerce_update_fields(PartnerModel, fields).items():
            setattr(row, k, v)
        await self._s.flush()
        return _UpdateResult(1)

    async def delete_one(self, pid: str) -> _DeleteResult:
        row = await self._s.get(PartnerModel, pid)
        if row:
            await self._s.delete(row)
            await self._s.flush()
            return _DeleteResult(1)
        return _DeleteResult(0)

    async def find_all(self, exclude_fields: Optional[set] = None, limit: int = 1000) -> List[dict]:
        stmt = select(PartnerModel).limit(limit)
        rows = (await self._s.execute(stmt)).scalars().all()
        partners = [r.to_dict() for r in rows]
        if exclude_fields:
            partners = [{k: v for k, v in p.items() if k not in exclude_fields} for p in partners]
        return partners

    async def find_by_ids(self, ids: List[str], fields: Optional[List[str]] = None) -> List[dict]:
        if not ids:
            return []
        stmt = select(PartnerModel).where(PartnerModel.id.in_(ids))
        rows = (await self._s.execute(stmt)).scalars().all()
        if fields:
            return [{k: r.to_dict()[k] for k in fields if k in r.to_dict()} for r in rows]
        return [r.to_dict() for r in rows]

    async def find_by_statuses(self, statuses: List[str], fields: Optional[List[str]] = None, limit: int = 1000) -> List[dict]:
        stmt = (
            select(PartnerModel)
            .where(PartnerModel.status.in_(statuses))
            .order_by(PartnerModel.business_name)
            .limit(limit)
        )
        rows = (await self._s.execute(stmt)).scalars().all()
        partners = [r.to_dict() for r in rows]
        if fields:
            partners = [{k: v for k, v in p.items() if k in fields} for p in partners]
        return partners

    async def find_by_slug(self, slug: str) -> Optional[dict]:
        return await self.find_one(catalog_slug=slug)


# ---------------------------------------------------------------------------
# Purchases
# ---------------------------------------------------------------------------
class PurchaseRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def get_by_id(self, pid: str) -> Optional[dict]:
        row = await self._s.get(PurchaseModel, pid)
        return row.to_dict() if row else None

    async def insert_one(self, doc: dict) -> str:
        doc_id, kwargs = _prep_insert(PurchaseModel, doc)
        row = PurchaseModel(id=doc_id, **kwargs)
        self._s.add(row)
        try:
            await self._s.flush()
        except IntegrityError as e:
            await self._s.rollback()
            raise DuplicateKeyError(str(e)) from e
        return doc_id

    async def update_one(self, pid: str, **fields: Any) -> _UpdateResult:
        row = await self._s.get(PurchaseModel, pid)
        if not row:
            return _UpdateResult(0)
        for k, v in _coerce_update_fields(PurchaseModel, fields).items():
            setattr(row, k, v)
        await self._s.flush()
        return _UpdateResult(1)

    async def delete_many_by_user(self, user_id: str) -> _DeleteResult:
        stmt = delete(PurchaseModel).where(PurchaseModel.user_id == user_id)
        r = await self._s.execute(stmt)
        await self._s.flush()
        return _DeleteResult(r.rowcount or 0)

    async def find_by_user(self, user_id: str, limit: int = 100, sort_desc: bool = True) -> List[dict]:
        stmt = select(PurchaseModel).where(PurchaseModel.user_id == user_id)
        stmt = stmt.order_by(PurchaseModel.timestamp.desc() if sort_desc else PurchaseModel.timestamp)
        stmt = stmt.limit(limit)
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def find_by_user_since(self, user_id: str, since: datetime, limit: int = 100) -> List[dict]:
        stmt = (
            select(PurchaseModel)
            .where(PurchaseModel.user_id == user_id, PurchaseModel.timestamp >= since)
            .limit(limit)
        )
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def count_by_user(self, user_id: str) -> int:
        stmt = select(func.count()).select_from(PurchaseModel).where(PurchaseModel.user_id == user_id)
        return (await self._s.execute(stmt)).scalar_one()

    async def find_by_user_submitted(self, user_id: str, limit: int = 200) -> List[dict]:
        stmt = (
            select(PurchaseModel)
            .where(PurchaseModel.user_id == user_id, PurchaseModel.submitted_by_user == True)  # noqa: E712
            .order_by(PurchaseModel.timestamp.desc())
            .limit(limit)
        )
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def find_by_user_and_id(self, purchase_id: str, user_id: str) -> Optional[dict]:
        stmt = select(PurchaseModel).where(PurchaseModel.id == purchase_id, PurchaseModel.user_id == user_id)
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        return row.to_dict() if row else None

    async def find_by_user_verified(self, user_id: str, limit: int = 1000) -> List[dict]:
        stmt = (
            select(PurchaseModel)
            .where(PurchaseModel.user_id == user_id, PurchaseModel.status == "VERIFIED")
            .limit(limit)
        )
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def find_all(self, limit: int = 1000, sort_desc: bool = True) -> List[dict]:
        stmt = select(PurchaseModel).limit(limit)
        stmt = stmt.order_by(PurchaseModel.detected_at.desc() if sort_desc else PurchaseModel.detected_at)
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def find_by_partner(self, partner_id: str, statuses: Optional[List[str]] = None, limit: int = 1000) -> List[dict]:
        stmt = select(PurchaseModel).where(PurchaseModel.partner_id == partner_id)
        if statuses:
            stmt = stmt.where(PurchaseModel.status.in_(statuses))
        stmt = stmt.order_by(PurchaseModel.timestamp.desc()).limit(limit)
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def find_uncredited_verified(self, limit: int = 500) -> List[dict]:
        """Return VERIFIED purchases where points have not yet been credited."""
        stmt = (
            select(PurchaseModel)
            .where(
                PurchaseModel.status == "VERIFIED",
                PurchaseModel.points_credited == False,  # noqa: E712
            )
            .order_by(PurchaseModel.timestamp)
            .limit(limit)
        )
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def find_duplicate(self, order_id: str, transaction_id: Optional[str] = None) -> Optional[dict]:
        from sqlalchemy import or_
        conditions = [PurchaseModel.order_id == order_id]
        if transaction_id:
            conditions.append(PurchaseModel.transaction_id == transaction_id)
        stmt = select(PurchaseModel.id).where(or_(*conditions)).limit(1)
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        return {"id": row} if row else None


# ---------------------------------------------------------------------------
# Partner Orders
# ---------------------------------------------------------------------------
class PartnerOrderRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def get_by_id(self, oid: str) -> Optional[dict]:
        row = await self._s.get(PartnerOrderModel, oid)
        return row.to_dict() if row else None

    async def find_one(self, **kwargs: Any) -> Optional[dict]:
        stmt = select(PartnerOrderModel)
        for k, v in kwargs.items():
            stmt = stmt.where(getattr(PartnerOrderModel, k) == v)
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        return row.to_dict() if row else None

    async def insert_one(self, doc: dict) -> str:
        doc_id, kwargs = _prep_insert(PartnerOrderModel, doc)
        row = PartnerOrderModel(id=doc_id, **kwargs)
        self._s.add(row)
        await self._s.flush()
        return doc_id

    async def update_one(self, oid: str, **fields: Any) -> _UpdateResult:
        row = await self._s.get(PartnerOrderModel, oid)
        if not row:
            return _UpdateResult(0)
        for k, v in _coerce_update_fields(PartnerOrderModel, fields).items():
            setattr(row, k, v)
        await self._s.flush()
        return _UpdateResult(1)

    async def update_by_filter(self, filt: Dict[str, Any], **fields: Any) -> _UpdateResult:
        stmt = select(PartnerOrderModel)
        for k, v in filt.items():
            stmt = stmt.where(getattr(PartnerOrderModel, k) == v)
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        if not row:
            return _UpdateResult(0)
        for k, v in _coerce_update_fields(PartnerOrderModel, fields).items():
            setattr(row, k, v)
        await self._s.flush()
        return _UpdateResult(1)

    async def find_by_partner(self, partner_id: str, status: Optional[str] = None, limit: int = 1000) -> List[dict]:
        stmt = select(PartnerOrderModel).where(PartnerOrderModel.partner_id == partner_id)
        if status:
            stmt = stmt.where(PartnerOrderModel.status == status)
        stmt = stmt.order_by(PartnerOrderModel.created_at.desc()).limit(limit)
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def find_by_partner_and_id(self, oid: str, partner_id: str) -> Optional[dict]:
        stmt = select(PartnerOrderModel).where(
            PartnerOrderModel.id == oid, PartnerOrderModel.partner_id == partner_id
        )
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        return row.to_dict() if row else None


# ---------------------------------------------------------------------------
# Coupons
# ---------------------------------------------------------------------------
class CouponRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def get_by_id(self, cid: str) -> Optional[dict]:
        row = await self._s.get(CouponModel, cid)
        return row.to_dict() if row else None

    async def get_by_code(self, code: str) -> Optional[dict]:
        stmt = select(CouponModel).where(CouponModel.coupon_code == code)
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        return row.to_dict() if row else None

    async def code_exists(self, code: str, exclude_id: Optional[str] = None) -> bool:
        stmt = select(CouponModel.id).where(CouponModel.coupon_code == code)
        if exclude_id:
            stmt = stmt.where(CouponModel.id != exclude_id)
        return (await self._s.execute(stmt)).scalar_one_or_none() is not None

    async def insert_one(self, doc: dict) -> str:
        doc_id, kwargs = _prep_insert(CouponModel, doc)
        row = CouponModel(id=doc_id, **kwargs)
        self._s.add(row)
        await self._s.flush()
        return doc_id

    async def update_one(self, cid: str, **fields: Any) -> _UpdateResult:
        row = await self._s.get(CouponModel, cid)
        if not row:
            return _UpdateResult(0)
        for k, v in _coerce_update_fields(CouponModel, fields).items():
            setattr(row, k, v)
        await self._s.flush()
        return _UpdateResult(1)

    async def delete_one(self, cid: str) -> _DeleteResult:
        row = await self._s.get(CouponModel, cid)
        if row:
            await self._s.delete(row)
            await self._s.flush()
            return _DeleteResult(1)
        return _DeleteResult(0)

    async def find_all(self, limit: int = 1000) -> List[dict]:
        stmt = select(CouponModel).order_by(CouponModel.created_at.desc()).limit(limit)
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def find_active_available(self, limit: int = 500) -> List[dict]:
        now = datetime.now(timezone.utc)
        stmt = (
            select(CouponModel)
            .where(
                CouponModel.is_active == True,  # noqa: E712
                CouponModel.expiry_date > now,
                CouponModel.redeemed_count < CouponModel.total_quantity,
            )
            .order_by(CouponModel.created_at.desc())
            .limit(limit)
        )
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def find_by_ids(self, ids: List[str]) -> List[dict]:
        if not ids:
            return []
        stmt = select(CouponModel).where(CouponModel.id.in_(ids))
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def atomic_redeem(self, coupon_id: str) -> Optional[dict]:
        """Atomically increment redeemed_count if the coupon is still redeemable. Returns AFTER doc or None."""
        now = datetime.now(timezone.utc)
        row = await self._s.get(CouponModel, coupon_id)
        if not row:
            return None
        if not row.is_active or row.expiry_date <= now or row.redeemed_count >= row.total_quantity:
            return None
        row.redeemed_count += 1
        await self._s.flush()
        return row.to_dict()

    async def decrement_redeemed(self, coupon_id: str) -> None:
        row = await self._s.get(CouponModel, coupon_id)
        if row and row.redeemed_count > 0:
            row.redeemed_count -= 1
            await self._s.flush()


# ---------------------------------------------------------------------------
# Redemptions
# ---------------------------------------------------------------------------
class RedemptionRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def insert_one(self, doc: dict) -> str:
        doc_id, kwargs = _prep_insert(RedemptionModel, doc)
        row = RedemptionModel(id=doc_id, **kwargs)
        self._s.add(row)
        try:
            await self._s.flush()
        except IntegrityError as e:
            await self._s.rollback()
            raise DuplicateKeyError(str(e)) from e
        return doc_id

    async def count(self, user_id: str, coupon_id: str) -> int:
        stmt = select(func.count()).select_from(RedemptionModel).where(
            RedemptionModel.user_id == user_id, RedemptionModel.coupon_id == coupon_id
        )
        return (await self._s.execute(stmt)).scalar_one()

    async def find_by_user(self, user_id: str, limit: int = 200) -> List[dict]:
        stmt = (
            select(RedemptionModel)
            .where(RedemptionModel.user_id == user_id)
            .order_by(RedemptionModel.redeemed_at.desc())
            .limit(limit)
        )
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def find_recent(self, limit: int = 30) -> List[dict]:
        stmt = select(RedemptionModel).order_by(RedemptionModel.redeemed_at.desc()).limit(limit)
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def count_by_user(self, user_id: str) -> int:
        stmt = select(func.count()).select_from(RedemptionModel).where(RedemptionModel.user_id == user_id)
        return (await self._s.execute(stmt)).scalar_one()

    async def count_by_users(self, user_ids: List[str]) -> Dict[str, int]:
        if not user_ids:
            return {}
        stmt = (
            select(RedemptionModel.user_id, func.count())
            .where(RedemptionModel.user_id.in_(user_ids))
            .group_by(RedemptionModel.user_id)
        )
        rows = (await self._s.execute(stmt)).all()
        return {uid: cnt for uid, cnt in rows}


# ---------------------------------------------------------------------------
# Points Ledger
# ---------------------------------------------------------------------------
class PointsLedgerRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def insert_one(self, doc: dict) -> str:
        doc_id, kwargs = _prep_insert(PointsLedgerModel, doc)
        row = PointsLedgerModel(id=doc_id, **kwargs)
        self._s.add(row)
        await self._s.flush()
        return doc_id

    async def find_by_user(self, user_id: str, limit: int = 50) -> List[dict]:
        stmt = (
            select(PointsLedgerModel)
            .where(PointsLedgerModel.user_id == user_id)
            .order_by(PointsLedgerModel.created_at.desc())
            .limit(limit)
        )
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def delete_many_by_user(self, user_id: str) -> _DeleteResult:
        stmt = delete(PointsLedgerModel).where(PointsLedgerModel.user_id == user_id)
        r = await self._s.execute(stmt)
        await self._s.flush()
        return _DeleteResult(r.rowcount or 0)

    async def latest_per_user(self, user_ids: List[str]) -> Dict[str, dict]:
        """Return the latest ledger entry per user_id in the given list."""
        if not user_ids:
            return {}
        from sqlalchemy import literal_column
        subq = (
            select(
                PointsLedgerModel,
                func.row_number()
                .over(partition_by=PointsLedgerModel.user_id, order_by=PointsLedgerModel.created_at.desc())
                .label("rn"),
            )
            .where(PointsLedgerModel.user_id.in_(user_ids))
            .subquery()
        )
        stmt = select(subq).where(literal_column("rn") == 1)
        rows = (await self._s.execute(stmt)).all()
        result: Dict[str, dict] = {}
        for row in rows:
            d = {}
            for col in PointsLedgerModel.__table__.columns:
                d[col.name] = getattr(row, col.name, None)
                if isinstance(d[col.name], datetime):
                    d[col.name] = d[col.name].isoformat()
            result[d["user_id"]] = d
        return result


# ---------------------------------------------------------------------------
# Chat Messages
# ---------------------------------------------------------------------------
class ChatMessageRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def insert_one(self, doc: dict) -> str:
        doc_id, kwargs = _prep_insert(ChatMessageModel, doc)
        row = ChatMessageModel(id=doc_id, **kwargs)
        self._s.add(row)
        await self._s.flush()
        return doc_id

    async def find_by_user(self, user_id: str, limit: int = 100, sort_asc: bool = False) -> List[dict]:
        order = ChatMessageModel.timestamp if sort_asc else ChatMessageModel.timestamp.desc()
        stmt = select(ChatMessageModel).where(ChatMessageModel.user_id == user_id).order_by(order).limit(limit)
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def delete_many_by_user(self, user_id: str) -> _DeleteResult:
        stmt = delete(ChatMessageModel).where(ChatMessageModel.user_id == user_id)
        r = await self._s.execute(stmt)
        await self._s.flush()
        return _DeleteResult(r.rowcount or 0)


# ---------------------------------------------------------------------------
# Catalog Products
# ---------------------------------------------------------------------------
class CatalogProductRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def get_by_id(self, pid: str) -> Optional[dict]:
        row = await self._s.get(CatalogProductModel, pid)
        return row.to_dict() if row else None

    async def find_one(self, **kwargs: Any) -> Optional[dict]:
        stmt = select(CatalogProductModel)
        for k, v in kwargs.items():
            stmt = stmt.where(getattr(CatalogProductModel, k) == v)
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        return row.to_dict() if row else None

    async def insert_one(self, doc: dict) -> str:
        doc_id, kwargs = _prep_insert(CatalogProductModel, doc)
        row = CatalogProductModel(id=doc_id, **kwargs)
        self._s.add(row)
        await self._s.flush()
        return doc_id

    async def update_one(self, pid: str, partner_id: str, **fields: Any) -> _UpdateResult:
        stmt = select(CatalogProductModel).where(
            CatalogProductModel.id == pid, CatalogProductModel.partner_id == partner_id
        )
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        if not row:
            return _UpdateResult(0)
        for k, v in _coerce_update_fields(CatalogProductModel, fields).items():
            setattr(row, k, v)
        await self._s.flush()
        return _UpdateResult(1)

    async def delete_one(self, pid: str, partner_id: str) -> _DeleteResult:
        stmt = select(CatalogProductModel).where(
            CatalogProductModel.id == pid, CatalogProductModel.partner_id == partner_id
        )
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        if row:
            await self._s.delete(row)
            await self._s.flush()
            return _DeleteResult(1)
        return _DeleteResult(0)

    async def find_by_partner(self, partner_id: str, active_only: bool = False, limit: int = 2000) -> List[dict]:
        stmt = select(CatalogProductModel).where(CatalogProductModel.partner_id == partner_id)
        if active_only:
            stmt = stmt.where(CatalogProductModel.active == True)  # noqa: E712
        stmt = stmt.order_by(CatalogProductModel.created_at.desc()).limit(limit)
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]


# ---------------------------------------------------------------------------
# Partner Coupon Requests
# ---------------------------------------------------------------------------
class PartnerCouponRequestRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def get_by_id(self, rid: str) -> Optional[dict]:
        row = await self._s.get(PartnerCouponRequestModel, rid)
        return row.to_dict() if row else None

    async def insert_one(self, doc: dict) -> str:
        doc_id, kwargs = _prep_insert(PartnerCouponRequestModel, doc)
        row = PartnerCouponRequestModel(id=doc_id, **kwargs)
        self._s.add(row)
        await self._s.flush()
        return doc_id

    async def update_one(self, rid: str, **fields: Any) -> _UpdateResult:
        row = await self._s.get(PartnerCouponRequestModel, rid)
        if not row:
            return _UpdateResult(0)
        for k, v in _coerce_update_fields(PartnerCouponRequestModel, fields).items():
            setattr(row, k, v)
        await self._s.flush()
        return _UpdateResult(1)

    async def find_all(self, limit: int = 500) -> List[dict]:
        stmt = (
            select(PartnerCouponRequestModel)
            .order_by(PartnerCouponRequestModel.created_at.desc())
            .limit(limit)
        )
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def find_by_partner(self, partner_id: str, limit: int = 500) -> List[dict]:
        stmt = (
            select(PartnerCouponRequestModel)
            .where(PartnerCouponRequestModel.partner_id == partner_id)
            .order_by(PartnerCouponRequestModel.created_at.desc())
            .limit(limit)
        )
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]


# ---------------------------------------------------------------------------
# Signup OTPs
# ---------------------------------------------------------------------------
class SignupOtpRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def find_by_email(self, email: str) -> Optional[dict]:
        stmt = select(SignupOtpModel).where(SignupOtpModel.email == email)
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        return row.to_dict() if row else None

    async def insert_one(self, doc: dict) -> str:
        doc_id, kwargs = _prep_insert(SignupOtpModel, doc)
        row = SignupOtpModel(id=doc_id, **kwargs)
        self._s.add(row)
        await self._s.flush()
        return doc_id

    async def delete_by_email(self, email: str) -> _DeleteResult:
        stmt = delete(SignupOtpModel).where(SignupOtpModel.email == email)
        r = await self._s.execute(stmt)
        await self._s.flush()
        return _DeleteResult(r.rowcount or 0)


# ---------------------------------------------------------------------------
# Leads
# ---------------------------------------------------------------------------
class LeadRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def insert_one(self, doc: dict) -> str:
        doc_id, kwargs = _prep_insert(LeadModel, doc)
        row = LeadModel(id=doc_id, **kwargs)
        self._s.add(row)
        await self._s.flush()
        return doc_id


# ---------------------------------------------------------------------------
# Surveys
# ---------------------------------------------------------------------------
class UserSurveyRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def insert_one(self, doc: dict) -> str:
        doc_id, kwargs = _prep_insert(UserSurveyModel, doc)
        row = UserSurveyModel(id=doc_id, **kwargs)
        self._s.add(row)
        await self._s.flush()
        return doc_id


class PartnerSurveyRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def insert_one(self, doc: dict) -> str:
        doc_id, kwargs = _prep_insert(PartnerSurveyModel, doc)
        row = PartnerSurveyModel(id=doc_id, **kwargs)
        self._s.add(row)
        await self._s.flush()
        return doc_id


# ---------------------------------------------------------------------------
# User Favorite Stores
# ---------------------------------------------------------------------------
class UserFavoriteStoreRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def get_by_user(self, user_id: str) -> Optional[dict]:
        stmt = select(UserFavoriteStoreModel).where(UserFavoriteStoreModel.user_id == user_id)
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        return row.to_dict() if row else None

    async def add_store(self, user_id: str, store_id: str) -> None:
        row = (
            await self._s.execute(select(UserFavoriteStoreModel).where(UserFavoriteStoreModel.user_id == user_id))
        ).scalar_one_or_none()
        now = datetime.now(timezone.utc).isoformat()
        if row:
            current = list(row.store_ids or [])
            if store_id not in current:
                current.append(store_id)
            row.store_ids = current  # new list triggers JSONB change detection
            row.updated_at = now
        else:
            self._s.add(UserFavoriteStoreModel(user_id=user_id, store_ids=[store_id], updated_at=now))
        await self._s.flush()

    async def remove_store(self, user_id: str, store_id: str) -> None:
        row = (
            await self._s.execute(select(UserFavoriteStoreModel).where(UserFavoriteStoreModel.user_id == user_id))
        ).scalar_one_or_none()
        if row and row.store_ids and store_id in row.store_ids:
            row.store_ids = [s for s in row.store_ids if s != store_id]
            row.updated_at = datetime.now(timezone.utc).isoformat()
            await self._s.flush()


# ---------------------------------------------------------------------------
# Email Ingest
# ---------------------------------------------------------------------------
class EmailIngestLogRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def insert_one(self, doc: dict) -> str:
        doc_id, kwargs = _prep_insert(EmailIngestLogModel, doc)
        row = EmailIngestLogModel(id=doc_id, **kwargs)
        self._s.add(row)
        await self._s.flush()
        return doc_id

    async def find_recent(self, limit: int = 100) -> List[dict]:
        stmt = select(EmailIngestLogModel).order_by(EmailIngestLogModel.created_at.desc()).limit(limit)
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]


class EmailIngestProcessedRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def find_by_message_id(self, message_id: str) -> Optional[dict]:
        stmt = select(EmailIngestProcessedModel).where(EmailIngestProcessedModel.message_id == message_id)
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        return row.to_dict() if row else None

    async def upsert(self, message_id: str, **fields: Any) -> None:
        stmt = select(EmailIngestProcessedModel).where(EmailIngestProcessedModel.message_id == message_id)
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        if row:
            for k, v in fields.items():
                setattr(row, k, v)
        else:
            self._s.add(EmailIngestProcessedModel(message_id=message_id, **fields))
        await self._s.flush()


# ---------------------------------------------------------------------------
# Zoho Mail Tokens
# ---------------------------------------------------------------------------
class ZohoMailTokenRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def find_one(self, **kwargs: Any) -> Optional[dict]:
        stmt = select(ZohoMailTokenModel)
        for k, v in kwargs.items():
            stmt = stmt.where(getattr(ZohoMailTokenModel, k) == v)
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        return row.to_dict() if row else None

    async def upsert_by_account(self, zoho_account_id: str, **fields: Any) -> None:
        stmt = select(ZohoMailTokenModel).where(ZohoMailTokenModel.zoho_account_id == zoho_account_id)
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        if row:
            for k, v in fields.items():
                setattr(row, k, v)
        else:
            self._s.add(ZohoMailTokenModel(zoho_account_id=zoho_account_id, **fields))
        await self._s.flush()

    async def find_all(self) -> List[dict]:
        stmt = select(ZohoMailTokenModel)
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]


# ---------------------------------------------------------------------------
# ReferralRepo
# ---------------------------------------------------------------------------
class ReferralRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def insert_one(self, doc: dict) -> str:
        doc_id, kwargs = _prep_insert(ReferralTransactionModel, doc)
        row = ReferralTransactionModel(id=doc_id, **kwargs)
        self._s.add(row)
        try:
            await self._s.flush()
        except IntegrityError as e:
            await self._s.rollback()
            raise DuplicateKeyError(str(e)) from e
        return doc_id

    async def get_by_invitee(self, invitee_id: str) -> Optional[dict]:
        stmt = select(ReferralTransactionModel).where(ReferralTransactionModel.invitee_id == invitee_id)
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        return row.to_dict() if row else None

    async def find_by_inviter(self, inviter_id: str) -> List[dict]:
        stmt = (
            select(ReferralTransactionModel)
            .where(ReferralTransactionModel.inviter_id == inviter_id)
            .order_by(ReferralTransactionModel.created_at.desc())
        )
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def update_one(self, txn_id: str, **fields: Any) -> None:
        row = await self._s.get(ReferralTransactionModel, txn_id)
        if row:
            for k, v in fields.items():
                setattr(row, k, v)
            await self._s.flush()

    async def count_by_inviter(self, inviter_id: str) -> int:
        stmt = select(func.count()).select_from(ReferralTransactionModel).where(
            ReferralTransactionModel.inviter_id == inviter_id
        )
        return (await self._s.execute(stmt)).scalar_one()

    async def sum_points_by_inviter(self, inviter_id: str) -> int:
        stmt = select(func.coalesce(func.sum(ReferralTransactionModel.inviter_points), 0)).where(
            ReferralTransactionModel.inviter_id == inviter_id,
            ReferralTransactionModel.reward_given == True,  # noqa: E712
        )
        return (await self._s.execute(stmt)).scalar_one()


# ---------------------------------------------------------------------------
# Dynamic Coupons
# ---------------------------------------------------------------------------


class DynamicCouponConfigRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def find_active(self, limit: int = 200) -> List[dict]:
        stmt = (
            select(DynamicCouponConfigModel)
            .where(DynamicCouponConfigModel.is_active == True)  # noqa: E712
            .order_by(DynamicCouponConfigModel.min_unlock_amount.asc())
            .limit(limit)
        )
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def find_all(self, limit: int = 500) -> List[dict]:
        stmt = select(DynamicCouponConfigModel).order_by(DynamicCouponConfigModel.created_at.desc()).limit(limit)
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def get_by_id(self, config_id: str) -> Optional[dict]:
        row = await self._s.get(DynamicCouponConfigModel, config_id)
        return row.to_dict() if row else None

    async def insert_one(self, doc: dict) -> str:
        doc_id, kwargs = _prep_insert(DynamicCouponConfigModel, doc)
        row = DynamicCouponConfigModel(id=doc_id, **kwargs)
        self._s.add(row)
        await self._s.flush()
        return doc_id

    async def update_one(self, config_id: str, **fields: Any) -> _UpdateResult:
        row = await self._s.get(DynamicCouponConfigModel, config_id)
        if not row:
            return _UpdateResult(0)
        for k, v in _coerce_update_fields(DynamicCouponConfigModel, fields).items():
            setattr(row, k, v)
        await self._s.flush()
        return _UpdateResult(1)

    async def delete_one(self, config_id: str) -> _DeleteResult:
        row = await self._s.get(DynamicCouponConfigModel, config_id)
        if not row:
            return _DeleteResult(0)
        await self._s.delete(row)
        await self._s.flush()
        return _DeleteResult(1)


class UserDynamicCouponUnlockRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def get_by_user(self, user_id: str) -> Optional[dict]:
        stmt = select(UserDynamicCouponUnlockModel).where(UserDynamicCouponUnlockModel.user_id == user_id)
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        return row.to_dict() if row else None

    async def insert_one(self, doc: dict) -> str:
        doc_id, kwargs = _prep_insert(UserDynamicCouponUnlockModel, doc)
        row = UserDynamicCouponUnlockModel(id=doc_id, **kwargs)
        self._s.add(row)
        await self._s.flush()
        return doc_id


class DynamicCouponRequestRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def insert_one(self, doc: dict) -> str:
        doc_id, kwargs = _prep_insert(DynamicCouponRequestModel, doc)
        row = DynamicCouponRequestModel(id=doc_id, **kwargs)
        self._s.add(row)
        await self._s.flush()
        return doc_id

    async def get_by_id(self, req_id: str) -> Optional[dict]:
        row = await self._s.get(DynamicCouponRequestModel, req_id)
        return row.to_dict() if row else None

    async def find_by_user(self, user_id: str, limit: int = 100) -> List[dict]:
        stmt = (
            select(DynamicCouponRequestModel)
            .where(DynamicCouponRequestModel.user_id == user_id)
            .order_by(DynamicCouponRequestModel.created_at.desc())
            .limit(limit)
        )
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def find_all(self, status_filter: Optional[str] = None, limit: int = 500) -> List[dict]:
        stmt = select(DynamicCouponRequestModel).order_by(DynamicCouponRequestModel.created_at.desc())
        if status_filter:
            stmt = stmt.where(DynamicCouponRequestModel.status == status_filter)
        stmt = stmt.limit(limit)
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def sum_locked_points(self, user_id: str) -> int:
        """Total points_used across pending requests for a user."""
        stmt = select(func.coalesce(func.sum(DynamicCouponRequestModel.points_used), 0)).where(
            DynamicCouponRequestModel.user_id == user_id,
            DynamicCouponRequestModel.status == "pending",
        )
        return (await self._s.execute(stmt)).scalar_one()

    async def update_one(self, req_id: str, **fields: Any) -> _UpdateResult:
        row = await self._s.get(DynamicCouponRequestModel, req_id)
        if not row:
            return _UpdateResult(0)
        for k, v in _coerce_update_fields(DynamicCouponRequestModel, fields).items():
            setattr(row, k, v)
        await self._s.flush()
        return _UpdateResult(1)


class DynamicCouponInventoryRepo:
    @property
    def _s(self) -> AsyncSession:
        return _session()

    async def insert_one(self, doc: dict) -> str:
        doc_id, kwargs = _prep_insert(DynamicCouponInventoryModel, doc)
        row = DynamicCouponInventoryModel(id=doc_id, **kwargs)
        self._s.add(row)
        await self._s.flush()
        return doc_id

    async def find_available(self, brand_name: str) -> Optional[dict]:
        """Return the first unused card for the given brand."""
        stmt = (
            select(DynamicCouponInventoryModel)
            .where(
                DynamicCouponInventoryModel.brand_name == brand_name,
                DynamicCouponInventoryModel.is_used == False,  # noqa: E712
            )
            .order_by(DynamicCouponInventoryModel.created_at.asc())
            .limit(1)
        )
        row = (await self._s.execute(stmt)).scalar_one_or_none()
        return row.to_dict() if row else None

    async def find_all(self, limit: int = 500) -> List[dict]:
        stmt = select(DynamicCouponInventoryModel).order_by(DynamicCouponInventoryModel.created_at.desc()).limit(limit)
        rows = (await self._s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async def get_by_id(self, inv_id: str) -> Optional[dict]:
        row = await self._s.get(DynamicCouponInventoryModel, inv_id)
        return row.to_dict() if row else None

    async def update_one(self, inv_id: str, **fields: Any) -> _UpdateResult:
        row = await self._s.get(DynamicCouponInventoryModel, inv_id)
        if not row:
            return _UpdateResult(0)
        for k, v in _coerce_update_fields(DynamicCouponInventoryModel, fields).items():
            setattr(row, k, v)
        await self._s.flush()
        return _UpdateResult(1)

    async def delete_one(self, inv_id: str) -> _DeleteResult:
        row = await self._s.get(DynamicCouponInventoryModel, inv_id)
        if not row:
            return _DeleteResult(0)
        if row.is_used:
            return _DeleteResult(0)
        await self._s.delete(row)
        await self._s.flush()
        return _DeleteResult(1)

    async def count_available(self, brand_name: str) -> int:
        stmt = select(func.count()).select_from(DynamicCouponInventoryModel).where(
            DynamicCouponInventoryModel.brand_name == brand_name,
            DynamicCouponInventoryModel.is_used == False,  # noqa: E712
        )
        return (await self._s.execute(stmt)).scalar_one()


# ---------------------------------------------------------------------------
# LynkrDB: drop-in namespace for route code — db.users, db.partners, etc.
# ---------------------------------------------------------------------------
class LynkrDB:
    users = UserRepo()
    partners = PartnerRepo()
    purchases = PurchaseRepo()
    partner_orders = PartnerOrderRepo()
    coupons = CouponRepo()
    redemptions = RedemptionRepo()
    points_ledger = PointsLedgerRepo()
    chat_messages = ChatMessageRepo()
    catalog_products = CatalogProductRepo()
    partner_coupon_requests = PartnerCouponRequestRepo()
    signup_otps = SignupOtpRepo()
    leads = LeadRepo()
    user_surveys = UserSurveyRepo()
    partner_surveys = PartnerSurveyRepo()
    user_favorite_stores = UserFavoriteStoreRepo()
    referrals = ReferralRepo()
    dynamic_coupon_configs = DynamicCouponConfigRepo()
    dynamic_coupon_requests = DynamicCouponRequestRepo()
    dynamic_coupon_inventory = DynamicCouponInventoryRepo()
    dynamic_coupon_unlocks = UserDynamicCouponUnlockRepo()
    email_ingest_logs = EmailIngestLogRepo()
    email_ingest_processed = EmailIngestProcessedRepo()
    zoho_mail_tokens = ZohoMailTokenRepo()
