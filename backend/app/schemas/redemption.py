from datetime import datetime

from pydantic import BaseModel


class Redemption(BaseModel):
    id: str
    user_id: str
    coupon_id: str
    redeemed_at: datetime
    points_deducted: int
