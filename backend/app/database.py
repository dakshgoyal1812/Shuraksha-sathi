import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# On Vercel / serverless environments, the filesystem is read-only except /tmp
if os.environ.get("VERCEL"):
    DATABASE_FILE = "/tmp/evacusafe.db"
    orig_db = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "evacusafe.db"))
    if not os.path.exists(DATABASE_FILE) and os.path.exists(orig_db):
        import shutil
        try:
            shutil.copyfile(orig_db, DATABASE_FILE)
        except Exception as e:
            print(f"Notice: Initial database copy to /tmp skipped: {e}")
else:
    DATABASE_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "evacusafe.db"))

os.makedirs(os.path.dirname(DATABASE_FILE), exist_ok=True)

raw_db_url = os.environ.get("DATABASE_URL")
if raw_db_url:
    if raw_db_url.startswith("postgres://"):
        raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URL = raw_db_url
else:
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_FILE}"

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
