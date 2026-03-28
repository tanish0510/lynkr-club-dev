import contextvars
from contextlib import asynccontextmanager
from typing import AsyncIterator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from pgdoc.models import Base as _DocStoreBase

db_session_ctx: contextvars.ContextVar[AsyncSession | None] = contextvars.ContextVar(
    "db_session", default=None
)

_engine: AsyncEngine | None = None
async_session_maker: async_sessionmaker[AsyncSession] | None = None


def create_engine_from_url(database_url: str) -> AsyncEngine:
    global _engine, async_session_maker
    _engine = create_async_engine(
        database_url,
        pool_pre_ping=True,
        echo=False,
    )
    async_session_maker = async_sessionmaker(
        _engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    return _engine


def get_session_maker() -> async_sessionmaker[AsyncSession]:
    if async_session_maker is None:
        raise RuntimeError("Database engine not initialized")
    return async_session_maker


def get_engine() -> AsyncEngine | None:
    return _engine


async def init_schema() -> None:
    if _engine is None:
        raise RuntimeError("Database engine not initialized")
    from app.models import Base as _OrmBase
    async with _engine.begin() as conn:
        await conn.run_sync(_DocStoreBase.metadata.create_all)
        await conn.run_sync(_OrmBase.metadata.create_all)


async def install_indexes() -> None:
    """Partial unique indexes that mirror former Mongo constraints."""
    if _engine is None:
        return
    stmts = [
        """
        CREATE UNIQUE INDEX IF NOT EXISTS ix_doc_users_username
        ON doc_store ((data->>'username'))
        WHERE collection = 'users' AND (data->>'username') IS NOT NULL
          AND (data->>'username') <> ''
        """,
        """
        CREATE UNIQUE INDEX IF NOT EXISTS ix_doc_users_lynkr_email_user
        ON doc_store ((data->>'lynkr_email'))
        WHERE collection = 'users' AND (data->>'role') = 'USER'
          AND (data->>'lynkr_email') IS NOT NULL AND (data->>'lynkr_email') <> ''
        """,
        """
        CREATE UNIQUE INDEX IF NOT EXISTS ix_doc_coupons_code
        ON doc_store ((data->>'coupon_code'))
        WHERE collection = 'coupons' AND (data->>'coupon_code') IS NOT NULL
        """,
        """
        CREATE UNIQUE INDEX IF NOT EXISTS ix_doc_redemptions_user_coupon
        ON doc_store ((data->>'user_id'), (data->>'coupon_id'))
        WHERE collection = 'redemptions'
        """,
        """
        CREATE UNIQUE INDEX IF NOT EXISTS ix_doc_purchases_user_order
        ON doc_store ((data->>'user_id'), (data->>'order_id'))
        WHERE collection = 'purchases'
        """,
        """
        CREATE UNIQUE INDEX IF NOT EXISTS ix_doc_partner_orders_purchase
        ON doc_store ((data->>'purchase_id'))
        WHERE collection = 'partner_orders'
          AND (data->>'purchase_id') IS NOT NULL AND (data->>'purchase_id') <> ''
        """,
        """
        CREATE UNIQUE INDEX IF NOT EXISTS ix_doc_email_ingest_msg
        ON doc_store ((data->>'message_id'))
        WHERE collection = 'email_ingest_processed' AND (data->>'message_id') IS NOT NULL
        """,
        """
        CREATE UNIQUE INDEX IF NOT EXISTS ix_doc_zoho_account
        ON doc_store ((data->>'zoho_account_id'))
        WHERE collection = 'zoho_mail_tokens' AND (data->>'zoho_account_id') IS NOT NULL
        """,
        """
        CREATE UNIQUE INDEX IF NOT EXISTS ix_doc_zoho_lynkr_email
        ON doc_store ((data->>'lynkr_email'))
        WHERE collection = 'zoho_mail_tokens' AND (data->>'lynkr_email') IS NOT NULL
        """,
    ]
    secondary = [
        """
        CREATE INDEX IF NOT EXISTS ix_doc_coupons_partner
        ON doc_store ((data->>'partner_id'))
        WHERE collection = 'coupons' AND (data->>'partner_id') IS NOT NULL
        """,
        """
        CREATE INDEX IF NOT EXISTS ix_doc_coupons_active
        ON doc_store ((data->>'is_active'))
        WHERE collection = 'coupons'
        """,
        """
        CREATE INDEX IF NOT EXISTS ix_doc_redemptions_coupon
        ON doc_store ((data->>'coupon_id'))
        WHERE collection = 'redemptions'
        """,
        """
        CREATE INDEX IF NOT EXISTS ix_doc_redemptions_user
        ON doc_store ((data->>'user_id'))
        WHERE collection = 'redemptions'
        """,
        """
        CREATE INDEX IF NOT EXISTS ix_doc_purchases_user
        ON doc_store ((data->>'user_id'))
        WHERE collection = 'purchases'
        """,
        """
        CREATE INDEX IF NOT EXISTS ix_doc_purchases_order
        ON doc_store ((data->>'order_id'))
        WHERE collection = 'purchases' AND (data->>'order_id') IS NOT NULL
        """,
        """
        CREATE INDEX IF NOT EXISTS ix_doc_purchases_txn
        ON doc_store ((data->>'transaction_id'))
        WHERE collection = 'purchases' AND (data->>'transaction_id') IS NOT NULL
        """,
        """
        CREATE INDEX IF NOT EXISTS ix_doc_partner_orders_partner
        ON doc_store ((data->>'partner_id'))
        WHERE collection = 'partner_orders'
        """,
        """
        CREATE INDEX IF NOT EXISTS ix_doc_email_ingest_logs_created
        ON doc_store ((data->>'created_at'))
        WHERE collection = 'email_ingest_logs'
        """,
    ]
    async with _engine.begin() as conn:
        for sql in stmts + secondary:
            try:
                await conn.execute(text(sql))
            except Exception:
                pass


def set_request_session_middleware(app):
    """Commit session after each HTTP request; rollback on error."""

    @app.middleware("http")
    async def _pg_session_mw(request, call_next):
        maker = get_session_maker()
        async with maker() as session:
            token = db_session_ctx.set(session)
            try:
                response = await call_next(request)
                await session.commit()
                return response
            except Exception:
                await session.rollback()
                raise
            finally:
                db_session_ctx.reset(token)

    return app


@asynccontextmanager
async def worker_session_scope() -> AsyncIterator[AsyncSession]:
    """Background tasks: one transaction; sets contextvar for db.* calls."""
    maker = get_session_maker()
    async with maker() as session:
        token = db_session_ctx.set(session)
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            db_session_ctx.reset(token)
