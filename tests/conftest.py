import os
from pathlib import Path


TEST_DATABASE_PATH = Path("test_food_checker.db")

os.environ.setdefault("DATABASE_URL", f"sqlite:///./{TEST_DATABASE_PATH}")


def pytest_sessionfinish(session, exitstatus):
    TEST_DATABASE_PATH.unlink(missing_ok=True)
