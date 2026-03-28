from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class DynamicCouponInventoryModel(Base):
    __tablename__ = "dynamic_coupon_inventory"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    brand_name: Mapped[str] = mapped_column(String(255), nullable=False)
    card_code: Mapped[str] = mapped_column(String(255), nullable=False)
    card_pin: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[int] = mapped_column(Integer, nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    assigned_to_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        Index("ix_dci_brand_name", "brand_name"),
        Index("ix_dci_is_used", "is_used"),
    )

    def to_dict(self) -> dict:
        d = {}
        for c in self.__table__.columns:
            v = getattr(self, c.name)
            if isinstance(v, datetime):
                v = v.isoformat()
            d[c.name] = v
        return d
