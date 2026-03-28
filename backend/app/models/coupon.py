from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class CouponModel(Base):
    __tablename__ = "coupons"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    partner_id: Mapped[str] = mapped_column(String(36), ForeignKey("partners.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    coupon_code: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    value_type: Mapped[str] = mapped_column(String(20), nullable=False, default="fixed")
    value: Mapped[float] = mapped_column(Float, nullable=False)
    min_purchase: Mapped[float | None] = mapped_column(Float, nullable=True)
    points_cost: Mapped[int] = mapped_column(Integer, nullable=False)
    expiry_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    total_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    redeemed_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    coupon_type: Mapped[str] = mapped_column(String(50), nullable=False, default="partner_specific")
    user_limit: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    campaign_tag: Mapped[str | None] = mapped_column(String(100), nullable=True)
    brand_logo: Mapped[str | None] = mapped_column(String(512), nullable=True)

    __table_args__ = (
        Index("ix_coupons_partner_id", "partner_id"),
        Index("ix_coupons_is_active", "is_active"),
    )

    def to_dict(self) -> dict:
        d = {}
        for c in self.__table__.columns:
            v = getattr(self, c.name)
            if isinstance(v, datetime):
                v = v.isoformat()
            d[c.name] = v
        return d
