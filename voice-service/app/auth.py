"""
Service-token verification.

The Next.js process mints a short-lived HS256 JWT for every voice request
with claims: { sub: userId, tier, locale, exp, iat }. We verify with the
shared VOICE_SERVICE_JWT_SECRET — no NextAuth internals leak here.
"""

import os
from typing import Optional

import jwt
from fastapi import Header, HTTPException, status

ALG = "HS256"
ISSUER = "friendsai-next"


class ServiceContext:
    """The validated identity + tier context attached to a request."""

    def __init__(self, user_id: str, tier: str, locale: Optional[str]):
        self.user_id = user_id
        self.tier = tier
        self.locale = locale


def _secret() -> str:
    s = os.getenv("VOICE_SERVICE_JWT_SECRET")
    if not s:
        # Failing fast in production is correct; dev gets a clear error too.
        raise RuntimeError(
            "VOICE_SERVICE_JWT_SECRET is not set. Copy .env.example to .env "
            "and fill it (must match the Next.js value)."
        )
    return s


def verify_token(authorization: str = Header(None)) -> ServiceContext:
    """
    FastAPI dependency. Raises 401 on missing / invalid / expired token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token",
        )
    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = jwt.decode(
            token,
            _secret(),
            algorithms=[ALG],
            issuer=ISSUER,
            options={"require": ["sub", "exp", "iat"]},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    return ServiceContext(
        user_id=str(payload["sub"]),
        tier=str(payload.get("tier", "free")),
        locale=payload.get("locale"),
    )
