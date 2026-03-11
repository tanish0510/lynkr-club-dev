import logging
import os
import re
from typing import Any, Dict, List, Optional

import httpx

from services.zoho_token_manager import ZohoTokenManager  # noqa: F401 – also used by server.py callers

PURCHASE_KEYWORDS = (
    "order confirmed",
    "payment successful",
    "transaction id",
    "order id",
    "invoice",
    "order placed",
    "purchase",
)

IGNORE_KEYWORDS = (
    "otp",
    "one time password",
    "verification code",
    "promo",
    "newsletter",
    "unsubscribe",
    "marketing",
    "sale",
)

ORDER_PATTERNS = [
    re.compile(r"(?:order(?:\s*(?:id|no|number|#))?\s*[:\-]?\s*)([A-Za-z0-9\-_/]{6,})", re.IGNORECASE),
    re.compile(r"(?:order\s+reference\s*[:\-]?\s*)([A-Za-z0-9\-_/]{6,})", re.IGNORECASE),
]

TXN_PATTERNS = [
    re.compile(r"(?:transaction(?:\s*(?:id|no|number|#))?\s*[:\-]?\s*)([A-Za-z0-9\-_/]{6,})", re.IGNORECASE),
    re.compile(r"(?:txn(?:\s*(?:id|no|number|#))?\s*[:\-]?\s*)([A-Za-z0-9\-_/]{6,})", re.IGNORECASE),
    re.compile(r"(?:utr(?:\s*(?:id|no|number|#))?\s*[:\-]?\s*)([A-Za-z0-9\-_/]{6,})", re.IGNORECASE),
]

AMOUNT_PATTERNS = [
    re.compile(r"(?:amount|total|paid|payment)\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)", re.IGNORECASE),
    re.compile(r"(?:rs\.?|inr|₹)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)", re.IGNORECASE),
]


def _strip_html(text: str) -> str:
    if not text:
        return ""
    return re.sub(r"<[^>]+>", " ", text)


def _extract_domain(email: str) -> str:
    if not email or "@" not in email:
        return ""
    return email.split("@", 1)[1].strip().lower()


def _extract_emails(value: Any) -> List[str]:
    if not value:
        return []
    if isinstance(value, list):
        emails: List[str] = []
        for item in value:
            emails.extend(_extract_emails(item))
        return emails
    text = str(value)
    candidates = re.findall(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}", text)
    return [c.strip().lower() for c in candidates]


def _brand_from_subject(subject: str, sender_email: str) -> str:
    clean_subject = re.sub(r"[^A-Za-z0-9\s]", " ", subject or "").strip()
    clean_subject = re.sub(
        r"\b(order|confirmed|invoice|payment|successful|transaction|id|your|has|been|placed)\b",
        " ",
        clean_subject,
        flags=re.IGNORECASE,
    )
    tokens = [token for token in clean_subject.split() if token]
    if tokens:
        return " ".join(tokens[:3]).title()
    sender_domain = _extract_domain(sender_email)
    if sender_domain:
        return sender_domain.split(".")[0].replace("-", " ").title()
    return "Partner"


def is_purchase_email(subject: str, body: str, sender_domain: str, known_partner_domains: List[str]) -> bool:
    haystack = f"{subject or ''} {body or ''}".lower()
    if any(keyword in haystack for keyword in IGNORE_KEYWORDS):
        return False
    if sender_domain and sender_domain in {d.lower() for d in known_partner_domains if d}:
        return True
    return any(keyword in haystack for keyword in PURCHASE_KEYWORDS)


def parse_purchase_email(email_body: str, subject: str = "", sender_email: str = "") -> Dict[str, Any]:
    text = _strip_html(email_body or "")
    parsed: Dict[str, Any] = {
        "partner_name": _brand_from_subject(subject, sender_email),
        "order_id": None,
        "transaction_id": None,
        "amount": None,
    }

    for pattern in ORDER_PATTERNS:
        match = pattern.search(text)
        if match:
            parsed["order_id"] = match.group(1).strip()
            break

    for pattern in TXN_PATTERNS:
        match = pattern.search(text)
        if match:
            parsed["transaction_id"] = match.group(1).strip()
            break

    for pattern in AMOUNT_PATTERNS:
        match = pattern.search(text)
        if match:
            amount_str = match.group(1).replace(",", "").strip()
            try:
                parsed["amount"] = float(amount_str)
                break
            except ValueError:
                continue

    return parsed


class MailboxPoller:
    """Polls a single Zoho Mail account for unread messages."""

    def __init__(self, account_id: str, lynkr_email: str, token_manager: ZohoTokenManager, api_base: str, timeout: float = 20):
        self.account_id = account_id
        self.lynkr_email = lynkr_email
        self._token_manager = token_manager
        self._api_base = api_base
        self._timeout = timeout

    async def _headers(self) -> Dict[str, str]:
        token = await self._token_manager.get_token()
        return {"Authorization": f"Zoho-oauthtoken {token}", "Content-Type": "application/json"}

    async def fetch_unread(self, limit: int = 25) -> List[Dict[str, Any]]:
        endpoint = f"{self._api_base}/accounts/{self.account_id}/messages/view"
        params = {"limit": max(1, min(limit, 200)), "status": "unread"}
        headers = await self._headers()
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            try:
                resp = await client.get(endpoint, headers=headers, params=params)
                if resp.status_code >= 400:
                    logging.warning("Mailbox %s fetch failed (%s): %s", self.lynkr_email, resp.status_code, (resp.text or "")[:300])
                    return []
                return self._normalize(resp.json())
            except Exception as exc:
                logging.warning("Mailbox %s fetch exception: %s", self.lynkr_email, exc)
        return []

    async def mark_read(self, message_id: str) -> None:
        if not message_id:
            return
        endpoint = f"{self._api_base}/accounts/{self.account_id}/updatemessage"
        headers = await self._headers()
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            try:
                resp = await client.put(endpoint, headers=headers, json={"mode": "markAsRead", "messageId": [message_id]})
                if resp.status_code >= 400:
                    logging.warning("Mark-read %s failed (%s): %s", self.lynkr_email, resp.status_code, (resp.text or "")[:300])
            except Exception as exc:
                logging.warning("Mark-read %s exception: %s", self.lynkr_email, exc)

    def _normalize(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        raw = payload.get("data") or payload.get("messages") or payload.get("mailList") or payload.get("items") or []
        if isinstance(raw, dict):
            raw = []
        out: List[Dict[str, Any]] = []
        for item in raw:
            sender_email = item.get("fromAddress") or item.get("from") or item.get("sender") or ""
            if isinstance(sender_email, dict):
                sender_email = sender_email.get("email") or sender_email.get("address") or ""

            recipients = _extract_emails(item.get("toAddress") or item.get("to") or item.get("recipients"))
            recipients.extend(_extract_emails(item.get("deliveredTo") or item.get("recipient")))
            if self.lynkr_email and self.lynkr_email not in recipients:
                recipients.append(self.lynkr_email)

            body = item.get("content") or item.get("summary") or item.get("body") or item.get("snippet") or ""
            mid = str(item.get("messageId") or item.get("id") or item.get("mailId") or "").strip()
            if not mid:
                continue

            is_read = item.get("status") == "1" or bool(item.get("isRead") or item.get("read") or item.get("is_read"))

            out.append({
                "message_id": mid,
                "subject": str(item.get("subject") or ""),
                "sender_email": _extract_emails(sender_email)[0] if _extract_emails(sender_email) else str(sender_email).lower(),
                "sender_domain": _extract_domain(str(sender_email)),
                "recipients": recipients,
                "body": str(body),
                "is_read": is_read,
                "mailbox_email": self.lynkr_email,
                "mailbox_account_id": self.account_id,
                "raw": item,
            })
        return out


class EmailIngestService:
    """Polls multiple Zoho Mail accounts for purchase-related emails.

    Mailbox credentials are loaded from the ``zoho_mail_tokens`` MongoDB
    collection.  Each document stores the Zoho ``account_id``, the user's
    ``lynkr_email``, and the OAuth ``refresh_token`` needed to poll that
    mailbox.
    """

    def __init__(self, db=None):
        self.api_base = (os.environ.get("ZOHO_MAIL_API_BASE", "https://mail.zoho.in/api") or "").rstrip("/")
        self.request_timeout = float(os.environ.get("ZOHO_MAIL_REQUEST_TIMEOUT", "20"))
        self._client_id = (os.environ.get("ZOHO_OAUTH_CLIENT_ID", "") or "").strip()
        self._client_secret = (os.environ.get("ZOHO_OAUTH_CLIENT_SECRET", "") or "").strip()
        self._token_url = (os.environ.get("ZOHO_OAUTH_TOKEN_URL", "https://accounts.zoho.in/oauth/v2/token") or "").strip()
        self._db = db
        self._pollers: Dict[str, MailboxPoller] = {}

    async def _load_pollers(self) -> List[MailboxPoller]:
        """Build a MailboxPoller for every token document in the DB."""
        if self._db is None:
            return list(self._pollers.values())

        docs = await self._db.zoho_mail_tokens.find({"enabled": {"$ne": False}}, {"_id": 0}).to_list(500)
        seen: set = set()
        for doc in docs:
            account_id = str(doc.get("zoho_account_id") or "").strip()
            lynkr_email = str(doc.get("lynkr_email") or "").strip().lower()
            refresh_token = str(doc.get("refresh_token") or "").strip()
            access_token = str(doc.get("access_token") or "").strip()
            if not account_id or not refresh_token:
                continue
            seen.add(account_id)
            if account_id not in self._pollers:
                tm = ZohoTokenManager(
                    access_token=access_token,
                    refresh_token=refresh_token,
                    client_id=self._client_id,
                    client_secret=self._client_secret,
                    token_url=self._token_url,
                    label=f"zoho-inbox-{lynkr_email or account_id}",
                )
                self._pollers[account_id] = MailboxPoller(
                    account_id=account_id,
                    lynkr_email=lynkr_email,
                    token_manager=tm,
                    api_base=self.api_base,
                    timeout=self.request_timeout,
                )
        stale = set(self._pollers) - seen
        for key in stale:
            del self._pollers[key]
        return list(self._pollers.values())

    async def fetch_all_unread(self, limit_per_mailbox: int = 25) -> List[Dict[str, Any]]:
        pollers = await self._load_pollers()
        if not pollers:
            logging.warning("No mailbox tokens configured for email ingest")
            return []

        all_messages: List[Dict[str, Any]] = []
        for poller in pollers:
            try:
                msgs = await poller.fetch_unread(limit=limit_per_mailbox)
                unread = [m for m in msgs if not m.get("is_read", False)]
                all_messages.extend(unread)
            except Exception as exc:
                logging.warning("Poller %s failed: %s", poller.lynkr_email, exc)
        return all_messages

    async def mark_email_read(self, message_id: str, account_id: str) -> None:
        poller = self._pollers.get(account_id)
        if poller:
            await poller.mark_read(message_id)
