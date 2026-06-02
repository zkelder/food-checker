from datetime import datetime, timedelta, timezone

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi import HTTPException

from app import auth


class FakeSigningKey:
    def __init__(self, key):
        self.key = key


class FakeJwksClient:
    def __init__(self, key):
        self.key = key

    def get_signing_key_from_jwt(self, token: str) -> FakeSigningKey:
        return FakeSigningKey(self.key)


@pytest.fixture
def signing_keys():
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()

    return private_key, public_key


@pytest.fixture(autouse=True)
def supabase_env(monkeypatch, signing_keys):
    _private_key, public_key = signing_keys

    monkeypatch.setenv("SUPABASE_URL", "https://gshoteosccfemoovochr.supabase.co")
    monkeypatch.setattr(auth, "get_jwks_client", lambda: FakeJwksClient(public_key))


def make_token(
    private_key,
    *,
    subject: str = "supabase-user-id",
    audience: str = "authenticated",
    issuer: str = "https://gshoteosccfemoovochr.supabase.co/auth/v1",
    expires_delta: timedelta = timedelta(minutes=5),
) -> str:
    now = datetime.now(timezone.utc)

    return jwt.encode(
        {
            "sub": subject,
            "aud": audience,
            "iss": issuer,
            "iat": now,
            "exp": now + expires_delta,
        },
        private_key,
        algorithm="ES256",
        headers={"kid": "test-key"},
    )


def test_get_current_user_id_falls_back_without_authorization_header():
    assert auth.get_current_user_id(None) == auth.LOCAL_PROFILE_USER_ID


def test_get_current_user_id_rejects_malformed_authorization_header():
    with pytest.raises(HTTPException) as error:
        auth.get_current_user_id("not-a-bearer-token")

    assert error.value.status_code == 401


def test_get_current_user_id_accepts_valid_supabase_es256_token(signing_keys):
    private_key, _public_key = signing_keys
    token = make_token(private_key)

    assert auth.get_current_user_id(f"Bearer {token}") == "supabase-user-id"


def test_get_current_user_id_rejects_expired_token(signing_keys):
    private_key, _public_key = signing_keys
    token = make_token(private_key, expires_delta=timedelta(minutes=-1))

    with pytest.raises(HTTPException) as error:
        auth.get_current_user_id(f"Bearer {token}")

    assert error.value.status_code == 401
    assert error.value.detail == "Session expired. Sign in again."


def test_get_current_user_id_rejects_wrong_audience(signing_keys):
    private_key, _public_key = signing_keys
    token = make_token(private_key, audience="anon")

    with pytest.raises(HTTPException) as error:
        auth.get_current_user_id(f"Bearer {token}")

    assert error.value.status_code == 401


def test_get_current_user_id_rejects_wrong_issuer(signing_keys):
    private_key, _public_key = signing_keys
    token = make_token(private_key, issuer="https://example.test/auth/v1")

    with pytest.raises(HTTPException) as error:
        auth.get_current_user_id(f"Bearer {token}")

    assert error.value.status_code == 401


def test_get_current_user_id_rejects_token_without_subject(signing_keys):
    private_key, _public_key = signing_keys
    token = make_token(private_key, subject="")

    with pytest.raises(HTTPException) as error:
        auth.get_current_user_id(f"Bearer {token}")

    assert error.value.status_code == 401
    assert error.value.detail == "Invalid session user."
