"""
Authentication helpers.

For now, auth is optional:
- If a valid Supabase Bearer token is present, use that user's Supabase id.
- If no token is present, fall back to the MVP local user id.
"""

import os
from functools import lru_cache

import jwt
from jwt import PyJWKClient
from jwt.exceptions import PyJWKClientError
from fastapi import Header, HTTPException

LOCAL_PROFILE_USER_ID = "local-mvp-user"
SUPABASE_JWT_AUDIENCE = "authenticated"
SUPABASE_JWT_ALGORITHMS = ["ES256"]


def get_supabase_url() -> str:
    """
    Return the configured Supabase project URL without a trailing slash.
    """
    supabase_url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")

    if not supabase_url:
        raise HTTPException(
            status_code=500,
            detail="Server auth is not configured.",
        )

    return supabase_url


def get_supabase_jwks_url() -> str:
    """
    Return the Supabase JWKS URL for asymmetric JWT signing keys.
    """
    return f"{get_supabase_url()}/auth/v1/.well-known/jwks.json"


@lru_cache(maxsize=1)
def get_jwks_client() -> PyJWKClient:
    """
    Return a cached JWKS client for Supabase public signing keys.
    """
    return PyJWKClient(get_supabase_jwks_url())


def get_current_user_id(
    authorization: str | None = Header(default=None),
) -> str:
    """
    Return the current user id.

    Uses Supabase JWT when present. Falls back to the local MVP user
    so older dev builds and local testing still work.
    """
    if not authorization:
        return LOCAL_PROFILE_USER_ID

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header.")

    token = authorization.removeprefix("Bearer ").strip()

    if not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header.")

    try:
        signing_key = get_jwks_client().get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=SUPABASE_JWT_ALGORITHMS,
            audience=SUPABASE_JWT_AUDIENCE,
            issuer=f"{get_supabase_url()}/auth/v1",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Sign in again.")
    except (jwt.InvalidTokenError, PyJWKClientError):
        raise HTTPException(status_code=401, detail="Invalid session. Sign in again.")

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session user.")

    return user_id
