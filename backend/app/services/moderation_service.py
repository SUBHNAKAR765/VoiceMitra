import re

BLOCKED_KEYWORDS = [
    "kill", "murder", "suicide", "bomb", "terrorist", "hack", "exploit",
    "porn", "sex", "nude", "drug", "cocaine", "heroin", "weapon",
    "racist", "nigger", "faggot", "bitch", "fuck", "shit", "asshole",
    "rape", "molest", "abuse", "violence", "gore",
]

REFUSAL_RESPONSE = "I'm sorry, I cannot help with that request. Please ask me something appropriate."


def is_safe(text: str) -> bool:
    lower = text.lower()
    # Remove punctuation for cleaner matching
    cleaned = re.sub(r"[^\w\s]", "", lower)
    words = set(cleaned.split())
    return not any(kw in words or kw in cleaned for kw in BLOCKED_KEYWORDS)


def get_refusal() -> str:
    return REFUSAL_RESPONSE
