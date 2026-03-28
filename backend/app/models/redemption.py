from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class RedemptionModel(Base):
    __tablename__ = "redemptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    coupon_id: Mapped[str] = mapped_column(String(36), ForeignKey("coupons.id"), nullable=False)
    coupon_code: Mapped[str] = mapped_column(String(100), nullable=False)
    redeemed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    points_deducted: Mapped[int] = mapped_column(Integer, nullable=False)

    __table_args__ = (
        Index("ix_redemptions_user_id", "user_id"),
        Index("ix_redemptions_coupon_id", "coupon_id"),
        Index("ix_redemptions_user_coupon", "user_id", "coupon_id"),
    )

    def to_dict(self) -> dict:
        d = {}
        for c in self.__table__.columns:
            v = getattr(self, c.name)
            if isinstance(v, datetime):
                v = v.isoformat()
            d[c.name] = v
        return d
