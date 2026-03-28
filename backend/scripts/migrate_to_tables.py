#!/usr/bin/env python3
"""
Migrate data from the single doc_store JSONB table into the new typed ORM tables.

Reads all rows from doc_store, groups by collection, maps each document into the
corresponding ORM model, and bulk-inserts into the new tables.  Idempotent: rows
whose id already exists in the target table are skipped.

Usage:
    cd backend && .venv/bin/python scripts/migrate_to_tables.py
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Type

ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = ROOT / ".env"
if ENV_FILE.exists():
    from dotenv import load_dotenv
    load_dotenv(ENV_FILE)

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from pgdoc.session import create_engine_from_url, get_session_maker, init_schema
from app.models import Base
from app.models.user import UserModel
from app.models.partner import PartnerModel
from app.models.purchase import PurchaseModel
from app.models.coupon import CouponModel
from app.models.redemption import RedemptionModel
from app.models.points_ledger import PointsLedgerModel
from app.models.partner_order import PartnerOrderModel
from app.models.chat_message import ChatMessageModel
from app.models.catalog_product import CatalogProductModel
from app.models.partner_coupon_request import PartnerCouponRequestModel
from app.models.misc import (
    SignupOtpModel,
    LeadModel,
    UserSurveyModel,
    PartnerSurveyModel,
    UserFavoriteStoreModel,
    EmailIngestLogModel,
    EmailIngestProcessedModel,
    ZohoMailTokenModel,
)

COLLECTION_TO_MODEL: Dict[str, Type] = {
    "users": UserModel,
    "partners": PartnerModel,
    "purchases": PurchaseModel,
    "coupons": CouponModel,
    "redemptions": RedemptionModel,
    "points_ledger": PointsLedgerModel,
    "partner_orders": PartnerOrderModel,
    "chat_messages": ChatMessageModel,
    "catalog_products": CatalogProductModel,
    "partner_coupon_requests": PartnerCouponRequestModel,
    "signup_otps": SignupOtpModel,
    "leads": LeadModel,
    "user_surveys": UserSurveyModel,
    "partner_surveys": PartnerSurveyModel,
    "user_favorite_stores": UserFavoriteStoreModel,
    "email_ingest_logs": EmailIngestLogModel,
    "email_ingest_processed": EmailIngestProcessedModel,
    "zoho_mail_tokens": ZohoMailTokenModel,
}


def _parse_datetime(val: Any) -> datetime | None:
    if val is None:
        return None
    if isinstance(val, datetime):
        return val
    try:
        s = str(val).replace("Z", "+00:00")
        return datetime.fromisoformat(s)
    except Exception:
        return None


def _coerce(model_cls: Type, data: Dict[str, Any]) -> Dict[str, Any]:
    """Coerce JSONB values to match the ORM column types."""
    from sqlalchemy import inspect as sa_inspect

    mapper = sa_inspect(model_cls)
    column_names = {c.key for c in mapper.column_attrs}
    row: Dict[str, Any] = {}
    for key, value in data.items():
        if key == "_id":
            continue
        if key not in column_names:
            continue

        col = mapper.columns[key]
        col_type = str(col.type).upper()

        if "DATETIME" in col_type or "TIMESTAMP" in col_type:
            value = _parse_datetime(value)
        elif "BOOLEAN" in col_type or "BOOL" in col_type:
            if isinstance(value, str):
                value = value.lower() in ("true", "1", "yes")
            else:
                value = bool(value) if value is not None else False
        elif "INTEGER" in col_type or "INT" in col_type:
            try:
                value = int(value) if value is not None else 0
            except (ValueError, TypeError):
                value = 0
        elif "FLOAT" in col_type or "DOUBLE" in col_type or "NUMERIC" in col_type:
            try:
                value = float(value) if value is not None else 0.0
            except (ValueError, TypeError):
                value = 0.0

        row[key] = value

    if "id" not in row:
        row["id"] = data.get("id")

    return row


async def migrate() -> None:
    url = (os.environ.get("DATABASE_URL") or "").strip()
    if not url:
        print("DATABASE_URL is not set.", file=sys.stderr)
        sys.exit(1)

    engine = create_engine_from_url(url)
    await init_schema()

    maker = get_session_maker()
    async with maker() as session:
        check = await session.execute(
            text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doc_store')")
        )
        if not check.scalar():
            print("doc_store table does not exist — nothing to migrate.")
            return

        result = await session.execute(text("SELECT collection, doc_id, data FROM doc_store"))
        rows = result.fetchall()
        print(f"Found {len(rows)} rows in doc_store.")

        by_collection: Dict[str, List[Dict[str, Any]]] = {}
        for collection, doc_id, data in rows:
            doc = data if isinstance(data, dict) else json.loads(data)
            doc.setdefault("id", doc_id)
            by_collection.setdefault(collection, []).append(doc)

        total_migrated = 0
        total_skipped = 0

        for collection_name in [
            "users", "partners", "purchases", "coupons", "redemptions",
            "points_ledger", "partner_orders", "chat_messages", "catalog_products",
            "partner_coupon_requests", "signup_otps", "leads",
            "user_surveys", "partner_surveys", "user_favorite_stores",
            "email_ingest_logs", "email_ingest_processed", "zoho_mail_tokens",
        ]:
            docs = by_collection.get(collection_name, [])
            if not docs:
                continue

            model_cls = COLLECTION_TO_MODEL.get(collection_name)
            if not model_cls:
                print(f"  SKIP {collection_name}: no model mapping")
                continue

            migrated = 0
            skipped = 0
            for doc in docs:
                doc_id = doc.get("id")
                if not doc_id:
                    skipped += 1
                    continue

                existing = await session.get(model_cls, doc_id)
                if existing:
                    skipped += 1
                    continue

                try:
                    coerced = _coerce(model_cls, doc)
                    row = model_cls(**coerced)
                    session.add(row)
                    await session.flush()
                    migrated += 1
                except Exception as e:
                    await session.rollback()
                    print(f"  ERROR {collection_name}/{doc_id}: {e}")
                    skipped += 1

            total_migrated += migrated
            total_skipped += skipped
            print(f"  {collection_name}: {migrated} migrated, {skipped} skipped")

        await session.commit()
        print(f"\nDone. {total_migrated} rows migrated, {total_skipped} skipped.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(migrate())
