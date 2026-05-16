import re
from app.services.search_service import web_search


def get_weather(query: str) -> str:
    city = _extract_city(query)
    search_query = f"current weather {city} temperature today" if city else "current weather today"
    return web_search(search_query)


def _extract_city(query: str) -> str:
    patterns = [
        r"weather (?:in|for|at|of) ([a-zA-Z\s]+)",
        r"(?:in|for|at) ([a-zA-Z\s]+) weather",
        r"temperature (?:in|of|at) ([a-zA-Z\s]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, query.lower())
        if match:
            return match.group(1).strip().title()
    return ""
