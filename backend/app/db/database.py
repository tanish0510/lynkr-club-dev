"""PostgreSQL database handle — now backed by typed ORM repositories."""
from pgdoc.session import create_engine_from_url

from app.core.config import DATABASE_URL
from app.db.repositories import LynkrDB

create_engine_from_url(DATABASE_URL)
db = LynkrDB()
