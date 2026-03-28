from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    username: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False, default="")
    dob: Mapped[str] = mapped_column(String(20), nullable=False, default="")
    gender: Mapped[str] = mapped_column(String(40), nullable=False, default="")
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="USER")
    lynkr_email: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    email_status: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVE")
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    verification_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verification_otp: Mapped[str | None] = mapped_column(String(10), nullable=True)
    verification_otp_expires_at: Mapped[str | None] = mapped_column(String(40), nullable=True)
    points: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    avatar: Mapped[str] = mapped_column(String(100), nullable=False, default="avatar_01.svg")
    profile_photo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    username_changed_at: Mapped[str | None] = mapped_column(String(40), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    onboarding_complete: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    notification_preferences: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    privacy_settings: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    theme_colors: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    extracted_palette: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    referral_code: Mapped[str | None] = mapped_column(String(30), nullable=True, unique=True)
    referred_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    has_made_first_purchase: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    partner_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)

    __table_args__ = (
        Index("ix_users_role", "role"),
        Index("ix_users_lynkr_email", "lynkr_email"),
    )

    def to_dict(self) -> dict:
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
