from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class Coupon(BaseModel):
    id: str
    partner_id: str
    title: str
    description: str
    coupon_code: str
    value_type: str  # percentage | fixed
    value: float
    min_purchase: Optional[float] = None
    points_cost: int
    expiry_date: datetime
    total_quantity: int
    redeemed_count: int
    is_active: bool
    created_at: datetime
