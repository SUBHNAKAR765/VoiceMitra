import logging
from ddgs import DDGS

logger = logging.getLogger(__name__)


def web_search(query: str) -> str:
    try:
        results = DDGS().text(query, max_results=5)
        if not results:
            return ""
        snippets = [r.get("body", "").strip() for r in results if r.get("body")]
        if not snippets:
            return ""
        best = max(snippets[:3], key=len)
        return _trim(best)
    except Exception as e:
        logger.error(f"Web search error: {e}")
        return ""


def _trim(text: str, max_chars: int = 450) -> str:
    if len(text) <= max_chars:
        return text
    trimmed = text[:max_chars]
    for sep in (". ", "! ", "? "):
        idx = trimmed.rfind(sep)
        if idx > max_chars // 2:
            return trimmed[: idx + 1]
    return trimmed.rsplit(" ", 1)[0] + "..."
