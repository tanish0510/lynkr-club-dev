"""
ASGI entrypoint for uvicorn: `uvicorn server:app`.

Application is defined in `app.main`.
"""
from app.main import app

__all__ = ["app"]
