"""
Authentication helpers.

For now, auth is optional:
- If a valid Supabase Bearer token is present, use that user's Supabase id.
- If no token is present, fall back to the MVP local user id.
"""

import os

import jwt
from fastapi import Header, HTTPException

LOCAL_PROFILE_USER_ID = "local-mvp-user"


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
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")

    if not jwt_secret:
        raise HTTPException(
            status_code=500,
            detail="Server auth is not configured.",
        )

    try:
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Sign in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session. Sign in again.")

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session user.")

    return user_id
