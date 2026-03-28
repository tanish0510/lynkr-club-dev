"""Process-wide mutable state (email ingest worker)."""
from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    import asyncio as asyncio_types
    from services.email_ingest_service import EmailIngestService

email_ingest_service: Optional["EmailIngestService"] = None
email_ingest_task: Optional[asyncio.Task] = None
email_ingest_stop_event = asyncio.Event()
