import re

INTENT_PATTERNS = {
    "greeting": [r"\b(hello|hi|hey|good morning|good evening|good afternoon|howdy|greetings)\b"],
    "weather":  [r"\b(weather|temperature|forecast|rain|sunny|cloudy|humidity|wind|hot|cold)\b"],
    "news":     [r"\b(news|headlines|latest news|breaking news|current events)\b"],
    "time":     [r"\b(what time|current time|what's the time)\b"],
    "date":     [r"\b(what('s| is) (today|the date)|today's date|what day)\b"],
}


def classify_intent(text: str) -> str:
    lower = text.lower()
    for intent, patterns in INTENT_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, lower):
                return intent
    # Everything else → web search
    return "search"
