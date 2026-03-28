#!/usr/bin/env python3
"""
Wipe application data in doc_store but keep every user with role ADMIN.

Uses DATABASE_URL from repo root .env (same as the backend).

Usage:
  cd backend && .venv/bin/python scripts/clean_db_keep_admin.py --yes
  Or from repo root: ./clean-db-keep-admin.sh --yes
"""
from __future__ import annotations

import argparse
import asyncio
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENV = ROOT / ".env"
if ENV.exists():
    from dotenv import load_dotenv

    load_dotenv(ENV)

from sqlalchemy import text

from pgdoc.session import create_engine_from_url, get_engine

ADMIN_ROLE = "ADMIN"


async def _run() -> None:
    url = (os.environ.get("DATABASE_URL") or "").strip()
    if not url:
        print(
            "DATABASE_URL is not set. Example:\n"
            "  export DATABASE_URL=postgresql+asyncpg://lynkr:lynkr@127.0.0.1:5432/lynkr_db",
            file=sys.stderr,
        )
        sys.exit(1)

    create_engine_from_url(url)
    eng = get_engine()
    assert eng is not None

    async with eng.begin() as conn:
        r = await conn.execute(
            text(
                """
                SELECT doc_id, data->>'email' AS email
                FROM doc_store
                WHERE collection = 'users' AND (data->>'role') = :role
                """
            ),
            {"role": ADMIN_ROLE},
        )
        admins = r.mappings().all()
        if not admins:
            print(
                "WARNING: No users with role ADMIN — non-admin users will be removed; "
                "other collections will be emptied."
            )
        else:
            emails = [a["email"] for a in admins if a.get("email")]
            print(f"Keeping {len(admins)} admin user(s): {emails}")

        del_other = await conn.execute(
            text("DELETE FROM doc_store WHERE collection <> 'users'")
        )
        print(f"Removed {del_other.rowcount} row(s) from non-user collections")

        del_users = await conn.execute(
            text(
                """
                DELETE FROM doc_store
                WHERE collection = 'users'
                  AND COALESCE(data->>'role', '') <> :role
                """
            ),
            {"role": ADMIN_ROLE},
        )
        print(f"users: removed {del_users.rowcount} non-admin row(s)")

        r2 = await conn.execute(
            text(
                """
                SELECT COUNT(*) AS n FROM doc_store
                WHERE collection = 'users' AND (data->>'role') = :role
                """
            ),
            {"role": ADMIN_ROLE},
        )
        n = r2.scalar_one()
        print(f"Done. Admin users remaining: {n}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Delete all DB data except ADMIN users.")
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Skip interactive confirmation (required for non-interactive runs).",
    )
    args = parser.parse_args()

    url = (os.environ.get("DATABASE_URL") or "").strip()
    if not args.yes:
        preview = url[:56] + "..." if len(url) > 56 else url
        print(f"Target: {preview}")
        print("This removes ALL doc_store rows except users where role == ADMIN.")
        if input("Type YES to continue: ").strip() != "YES":
            print("Aborted.")
            sys.exit(1)

    asyncio.run(_run())


if __name__ == "__main__":
    main()
