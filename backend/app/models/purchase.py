from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class PurchaseModel(Base):
    __tablename__ = "purchases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    brand: Mapped[str] = mapped_column(String(255), nullable=False)
    partner_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("partners.id"), nullable=True)
    order_id: Mapped[str] = mapped_column(String(255), nullable=False)
    transaction_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")
    submitted_by_user: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    source: Mapped[str | None] = mapped_column(String(50), nullable=True)
    edited_once: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    verification_source: Mapped[str | None] = mapped_column(String(20), nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    verified_at: Mapped[str | None] = mapped_column(Text, nullable=True)
    email_message_id: Mapped[str | None] = mapped_column(String(500), nullable=True)
    email_sender: Mapped[str | None] = mapped_column(String(255), nullable=True)
    points_credited: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true", default=True)

    __table_args__ = (
        Index("ix_purchases_user_id", "user_id"),
        Index("ix_purchases_partner_id", "partner_id"),
        Index("ix_purchases_status", "status"),
        Index("ix_purchases_order_id", "order_id"),
        Index("ix_purchases_transaction_id", "transaction_id"),
    )

    def to_dict(self) -> dict:
        d = {}
        for c in self.__table__.columns:
            v = getattr(self, c.name)
            if isinstance(v, datetime):
                v = v.isoformat()
            d[c.name] = v
        return d
