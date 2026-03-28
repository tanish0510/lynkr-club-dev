import os

import resend
from openai import AsyncOpenAI

from app.core import config as cfg
from services.zoho_token_manager import create_org_token_manager

resend.api_key = cfg.resend_api_key
openai_client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
zoho_org_token_manager = create_org_token_manager()
