import time
import hashlib
import hmac
from config import get_settings

settings = get_settings()
TOKENS: dict[str, float] = {}
TOKEN_TTL = 86400 * 7


def create_token() -> str:
    raw = f"{time.time()}-{settings.APP_PASSWORD}"
    token = hashlib.sha256(raw.encode()).hexdigest()
    TOKENS[token] = time.time()
    return token


def verify_token(token: str) -> bool:
    if token not in TOKENS:
        return False
    if time.time() - TOKENS[token] > TOKEN_TTL:
        del TOKENS[token]
        return False
    return True


def verify_password(password: str) -> bool:
    return hmac.compare_digest(password, settings.APP_PASSWORD)
