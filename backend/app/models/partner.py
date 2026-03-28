from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Index, Integer, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class PartnerModel(Base):
    __tablename__ = "partners"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    website: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    monthly_orders: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    commission_preference: Mapped[str] = mapped_column(String(50), nullable=False, default="2%")
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_person: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")
    temp_password: Mapped[str | None] = mapped_column(String(100), nullable=True)
    must_change_password: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    logo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    extracted_palette: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    catalog_slug: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    notification_preferences: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    domains: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    return_window_days: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default="0", default=0)

    __table_args__ = (
        Index("ix_partners_contact_email", "contact_email"),
        Index("ix_partners_status", "status"),
    )

    def to_dict(self) -> dict:
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
