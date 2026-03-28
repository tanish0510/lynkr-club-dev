from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class DynamicCouponRequestModel(Base):
    __tablename__ = "dynamic_coupon_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    config_id: Mapped[str] = mapped_column(String(36), nullable=False)
    brand_name: Mapped[str] = mapped_column(String(255), nullable=False)
    requested_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    points_used: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    admin_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    gift_card_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        Index("ix_dcr_user_id", "user_id"),
        Index("ix_dcr_status", "status"),
    )

    def to_dict(self) -> dict:
        d = {}
        for c in self.__table__.columns:
            v = getattr(self, c.name)
            if isinstance(v, datetime):
                v = v.isoformat()
            d[c.name] = v
        return d
