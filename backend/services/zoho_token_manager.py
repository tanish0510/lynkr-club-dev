import logging
import os
import time
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# Buffer before expiry to trigger refresh (5 minutes).
_REFRESH_BUFFER_SECONDS = 300


class ZohoTokenManager:
    """Manages Zoho OAuth access tokens with automatic refresh.

    Each instance wraps a single access_token / refresh_token pair.
    Call `get_token()` before every API request — it returns the current
    access token and transparently refreshes when close to expiry.
    """

    def __init__(
        self,
        *,
        access_token: str,
        refresh_token: str,
        client_id: str = "",
        client_secret: str = "",
        token_url: str = "https://accounts.zoho.in/oauth/v2/token",
        label: str = "zoho",
    ):
        self._access_token = access_token
        self._refresh_token = refresh_token
        self._client_id = client_id
        self._client_secret = client_secret
        self._token_url = token_url
        self._label = label
        self._refresh_enabled = bool(client_id and client_secret and refresh_token)
        # Force an immediate refresh on first get_token() call so we never rely
        # on a potentially-expired access token loaded from env vars.
        self._expires_at: float = 0.0 if self._refresh_enabled else float("inf")

    async def get_token(self) -> str:
        if self._refresh_enabled and time.time() >= (self._expires_at - _REFRESH_BUFFER_SECONDS):
            await self._refresh()
        return self._access_token

    async def _refresh(self) -> None:
        if not self._refresh_token or not self._client_id:
            return
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    self._token_url,
                    data={
                        "grant_type": "refresh_token",
                        "client_id": self._client_id,
                        "client_secret": self._client_secret,
                        "refresh_token": self._refresh_token,
                    },
                )
                if resp.status_code != 200:
                    logger.error("[%s] Token refresh failed (%s): %s", self._label, resp.status_code, resp.text[:300])
                    return
                body = resp.json()
                new_token = body.get("access_token", "").strip()
                if not new_token:
                    logger.error("[%s] Token refresh returned empty access_token", self._label)
                    return
                self._access_token = new_token
                self._expires_at = time.time() + int(body.get("expires_in", 3600))
                logger.info("[%s] Token refreshed, expires in %ss", self._label, body.get("expires_in", 3600))
        except Exception as exc:
            logger.error("[%s] Token refresh exception: %s", self._label, exc)


def _env(key: str, default: str = "") -> str:
    return (os.environ.get(key, default) or default).strip()


def create_org_token_manager() -> ZohoTokenManager:
    """Token for org-admin operations (mailbox provisioning)."""
    return ZohoTokenManager(
        access_token=_env("ZOHO_MAIL_ORG_OAUTH_TOKEN") or _env("ZOHO_MAIL_OAUTH_TOKEN"),
        refresh_token=_env("ZOHO_MAIL_ORG_REFRESH_TOKEN") or _env("ZOHO_MAIL_REFRESH_TOKEN"),
        client_id=_env("ZOHO_OAUTH_CLIENT_ID"),
        client_secret=_env("ZOHO_OAUTH_CLIENT_SECRET"),
        token_url=_env("ZOHO_OAUTH_TOKEN_URL", "https://accounts.zoho.in/oauth/v2/token"),
        label="zoho-org",
    )


def create_inbox_token_manager() -> ZohoTokenManager:
    """Token for inbox polling (admin@lynkr.club)."""
    return ZohoTokenManager(
        access_token=_env("ZOHO_MAIL_OAUTH_TOKEN"),
        refresh_token=_env("ZOHO_MAIL_REFRESH_TOKEN"),
        client_id=_env("ZOHO_OAUTH_CLIENT_ID"),
        client_secret=_env("ZOHO_OAUTH_CLIENT_SECRET"),
        token_url=_env("ZOHO_OAUTH_TOKEN_URL", "https://accounts.zoho.in/oauth/v2/token"),
        label="zoho-inbox",
    )
