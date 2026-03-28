from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class PartnerOrderModel(Base):
    __tablename__ = "partner_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    partner_id: Mapped[str] = mapped_column(String(36), ForeignKey("partners.id"), nullable=False)
    purchase_id: Mapped[str] = mapped_column(String(36), ForeignKey("purchases.id"), nullable=False)
    user_lynkr_email: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    order_id: Mapped[str] = mapped_column(String(255), nullable=False)
    transaction_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")
    acknowledged_at: Mapped[str | None] = mapped_column(String(40), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ix_partner_orders_partner_id", "partner_id"),
        Index("ix_partner_orders_purchase_id", "purchase_id"),
    )

    def to_dict(self) -> dict:
        d = {}
        for c in self.__table__.columns:
            v = getattr(self, c.name)
            if isinstance(v, datetime):
                v = v.isoformat()
            d[c.name] = v
        return d
