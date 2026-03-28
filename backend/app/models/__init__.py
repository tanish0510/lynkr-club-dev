"""SQLAlchemy ORM models for Lynkr."""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


from app.models.user import UserModel  # noqa: E402
from app.models.partner import PartnerModel  # noqa: E402
from app.models.purchase import PurchaseModel  # noqa: E402
from app.models.coupon import CouponModel  # noqa: E402
from app.models.redemption import RedemptionModel  # noqa: E402
from app.models.points_ledger import PointsLedgerModel  # noqa: E402
from app.models.partner_order import PartnerOrderModel  # noqa: E402
from app.models.chat_message import ChatMessageModel  # noqa: E402
from app.models.catalog_product import CatalogProductModel  # noqa: E402
from app.models.partner_coupon_request import PartnerCouponRequestModel  # noqa: E402
from app.models.referral import ReferralTransactionModel  # noqa: E402
from app.models.dynamic_coupon_config import DynamicCouponConfigModel  # noqa: E402
from app.models.dynamic_coupon_request import DynamicCouponRequestModel  # noqa: E402
from app.models.dynamic_coupon_inventory import DynamicCouponInventoryModel  # noqa: E402
from app.models.user_dynamic_coupon_unlock import UserDynamicCouponUnlockModel  # noqa: E402
from app.models.misc import (  # noqa: E402
    SignupOtpModel,
    LeadModel,
    UserSurveyModel,
    PartnerSurveyModel,
    UserFavoriteStoreModel,
    EmailIngestLogModel,
    EmailIngestProcessedModel,
    ZohoMailTokenModel,
)

__all__ = [
    "Base",
    "UserModel",
    "PartnerModel",
    "PurchaseModel",
    "CouponModel",
    "RedemptionModel",
    "PointsLedgerModel",
    "PartnerOrderModel",
    "ChatMessageModel",
    "CatalogProductModel",
    "PartnerCouponRequestModel",
    "ReferralTransactionModel",
    "DynamicCouponConfigModel",
    "DynamicCouponRequestModel",
    "DynamicCouponInventoryModel",
    "UserDynamicCouponUnlockModel",
    "SignupOtpModel",
    "LeadModel",
    "UserSurveyModel",
    "PartnerSurveyModel",
    "UserFavoriteStoreModel",
    "EmailIngestLogModel",
    "EmailIngestProcessedModel",
    "ZohoMailTokenModel",
]
