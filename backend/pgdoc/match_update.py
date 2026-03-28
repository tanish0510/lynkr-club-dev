from __future__ import annotations

import re
from typing import Any, Dict, List, Optional


def _field_value(doc: dict, ref: Any) -> Any:
    if isinstance(ref, str) and ref.startswith("$") and ref[1:] in doc:
        return doc.get(ref[1:])
    return ref


def _eval_expr(doc: dict, expr: Any) -> bool:
    if not isinstance(expr, dict):
        return bool(expr)
    if "$lt" in expr:
        a, b = expr["$lt"]
        va, vb = _field_value(doc, a), _field_value(doc, b)
        try:
            if isinstance(va, str) and isinstance(vb, str) and ("T" in va or "T" in vb):
                return va < vb
            return float(va) < float(vb)
        except (TypeError, ValueError):
            return str(va) < str(vb)
    if "$lte" in expr:
        a, b = expr["$lte"]
        va, vb = _field_value(doc, a), _field_value(doc, b)
        try:
            return float(va) <= float(vb)
        except (TypeError, ValueError):
            return str(va) <= str(vb)
    if "$gt" in expr:
        a, b = expr["$gt"]
        va, vb = _field_value(doc, a), _field_value(doc, b)
        try:
            if isinstance(va, str) and isinstance(vb, str):
                return va > vb
            return float(va) > float(vb)
        except (TypeError, ValueError):
            return str(va) > str(vb)
    if "$gte" in expr:
        a, b = expr["$gte"]
        va, vb = _field_value(doc, a), _field_value(doc, b)
        try:
            if isinstance(va, str) and isinstance(vb, str):
                return va >= vb
            return float(va) >= float(vb)
        except (TypeError, ValueError):
            return str(va) >= str(vb)
    return True


def match_document(doc: dict, filt: Optional[dict]) -> bool:
    if not filt:
        return True
    for key, val in filt.items():
        if key == "$or":
            if not isinstance(val, list) or not any(match_document(doc, p) for p in val):
                return False
            continue
        if key == "$and":
            if not isinstance(val, list) or not all(match_document(doc, p) for p in val):
                return False
            continue
        if key == "$expr":
            if not _eval_expr(doc, val):
                return False
            continue
        if isinstance(val, dict):
            if "$in" in val:
                if doc.get(key) not in val["$in"]:
                    return False
            elif "$nin" in val:
                if doc.get(key) in val["$nin"]:
                    return False
            elif "$ne" in val:
                if doc.get(key) == val["$ne"]:
                    return False
            elif "$regex" in val:
                flags = re.IGNORECASE if val.get("$options") == "i" else 0
                if not re.search(val["$regex"], str(doc.get(key, "")), flags):
                    return False
            elif "$gte" in val:
                dv, cv = doc.get(key), val["$gte"]
                try:
                    if isinstance(dv, str) and isinstance(cv, str):
                        if not (dv >= cv):
                            return False
                    elif not (float(dv) >= float(cv)):
                        return False
                except (TypeError, ValueError):
                    if str(dv) < str(cv):
                        return False
            elif "$gt" in val:
                dv, cv = doc.get(key), val["$gt"]
                try:
                    if isinstance(dv, str) and isinstance(cv, str):
                        if not (dv > cv):
                            return False
                    elif not (float(dv) > float(cv)):
                        return False
                except (TypeError, ValueError):
                    if str(dv) <= str(cv):
                        return False
            elif "$lte" in val:
                dv, cv = doc.get(key), val["$lte"]
                try:
                    if not (float(dv) <= float(cv)):
                        return False
                except (TypeError, ValueError):
                    if str(dv) > str(cv):
                        return False
            elif "$lt" in val:
                dv, cv = doc.get(key), val["$lt"]
                try:
                    if isinstance(dv, str) and isinstance(cv, str):
                        if not (dv < cv):
                            return False
                    elif not (float(dv) < float(cv)):
                        return False
                except (TypeError, ValueError):
                    if str(dv) >= str(cv):
                        return False
            elif "$exists" in val:
                exists = key in doc and doc[key] is not None
                if val["$exists"] and not exists:
                    return False
                if not val["$exists"] and exists:
                    return False
        else:
            if doc.get(key) != val:
                return False
    return True


def apply_update(doc: dict, update: Dict[str, Any]) -> dict:
    out = dict(doc)
    if "$set" in update:
        for k, v in update["$set"].items():
            if v is None:
                out.pop(k, None)
            else:
                out[k] = v
    if "$unset" in update:
        for k in update["$unset"]:
            out.pop(k, None)
    if "$inc" in update:
        for k, delta in update["$inc"].items():
            cur = out.get(k, 0)
            try:
                if isinstance(cur, bool):
                    cur = int(cur)
                cur_f = float(cur) if isinstance(cur, (int, float)) else float(str(cur))
                d_f = float(delta)
                if cur_f == int(cur_f) and d_f == int(d_f):
                    out[k] = int(cur_f + d_f)
                else:
                    out[k] = cur_f + d_f
            except (TypeError, ValueError):
                out[k] = int(cur or 0) + int(delta)
    if "$addToSet" in update:
        for k, v in update["$addToSet"].items():
            lst = list(out.get(k) or [])
            if v not in lst:
                lst.append(v)
            out[k] = lst
    if "$pull" in update:
        for k, v in update["$pull"].items():
            lst = [x for x in (out.get(k) or []) if x != v]
            out[k] = lst
    return out


def project_document(doc: dict, projection: Optional[dict]) -> dict:
    if not projection:
        return {k: v for k, v in doc.items() if k != "_id"}

    exclude_id = projection.get("_id") == 0
    inclusion_keys = [k for k, v in projection.items() if k != "_id" and v == 1]
    exclusion_keys = [k for k, v in projection.items() if k != "_id" and v == 0]

    if inclusion_keys:
        out = {k: doc[k] for k in inclusion_keys if k in doc}
    elif exclusion_keys:
        skip = set(exclusion_keys)
        out = {k: v for k, v in doc.items() if k not in skip}
    else:
        out = dict(doc)

    out.pop("_id", None) if exclude_id else None
    return out
