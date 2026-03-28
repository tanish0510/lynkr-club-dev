from pgdoc.collection import Collection
from pgdoc.constants import ReturnDocument

__all__ = ["LynkrDatabase", "ReturnDocument"]


class LynkrDatabase:
    """Mongo-like database with named collections backed by PostgreSQL JSONB."""

    def __init__(self):
        self.users = Collection("users")
        self.partners = Collection("partners")
        self.purchases = Collection("purchases")
        self.partner_orders = Collection("partner_orders")
        self.points_ledger = Collection("points_ledger")
        self.chat_messages = Collection("chat_messages")
        self.user_favorite_stores = Collection("user_favorite_stores")
        self.coupons = Collection("coupons")
        self.redemptions = Collection("redemptions")
        self.signup_otps = Collection("signup_otps")
        self.leads = Collection("leads")
        self.email_ingest_logs = Collection("email_ingest_logs")
        self.email_ingest_processed = Collection("email_ingest_processed")
        self.partner_coupon_requests = Collection("partner_coupon_requests")
        self.catalog_products = Collection("catalog_products")
        self.zoho_mail_tokens = Collection("zoho_mail_tokens")

    async def close(self):
        pass
