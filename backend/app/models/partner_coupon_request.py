from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class PartnerCouponRequestModel(Base):
    __tablename__ = "partner_coupon_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    partner_id: Mapped[str] = mapped_column(String(36), ForeignKey("partners.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    discount_or_reward_details: Mapped[str] = mapped_column(Text, nullable=False, default="")
    points_required: Mapped[int] = mapped_column(Integer, nullable=False)
    expiry_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    max_redemptions: Mapped[int] = mapped_column(Integer, nullable=False)
    terms_and_conditions: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    reviewed_at: Mapped[str | None] = mapped_column(String(40), nullable=True)
    reviewed_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    value_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    value: Mapped[float | None] = mapped_column(Float, nullable=True)
    coupon_code: Mapped[str | None] = mapped_column(String(100), nullable=True)

    __table_args__ = (
        Index("ix_partner_coupon_requests_partner_id", "partner_id"),
    )

    def to_dict(self) -> dict:
        d = {}
        for c in self.__table__.columns:
            v = getattr(self, c.name)
            if isinstance(v, datetime):
                v = v.isoformat()
            d[c.name] = v
        return d
