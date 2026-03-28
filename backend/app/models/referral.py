from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class ReferralTransactionModel(Base):
    __tablename__ = "referral_transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    inviter_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    invitee_id: Mapped[str] = mapped_column(String(36), nullable=False, unique=True)
    reward_given: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    inviter_points: Mapped[int | None] = mapped_column(nullable=True)
    invitee_points: Mapped[int | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self) -> dict:
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
