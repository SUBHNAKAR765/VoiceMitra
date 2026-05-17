import logging
try:
    from ddgs import DDGS
except ImportError:
    from duckduckgo_search import DDGS

logger = logging.getLogger(__name__)


def web_search(query: str) -> str:
    try:
        results = DDGS().text(query, max_results=5)
        if not results:
            return "I searched the web but couldn't find a clear answer. Please try rephrasing your question."

        snippets = [r.get("body", "").strip() for r in results if r.get("body")]
        if not snippets:
            return "I found some results but couldn't extract useful information."

        best = max(snippets[:3], key=len)
        return _trim(best)

    except Exception as e:
        logger.error(f"Web search error: {e}")
        return "I'm having trouble searching the web right now. Please try again in a moment."


def _trim(text: str, max_chars: int = 450) -> str:
    """Trim to a natural sentence boundary within max_chars."""
    if len(text) <= max_chars:
        return text
    trimmed = text[:max_chars]
    for sep in (". ", "! ", "? "):
        idx = trimmed.rfind(sep)
        if idx > max_chars // 2:
            return trimmed[: idx + 1]
    return trimmed.rsplit(" ", 1)[0] + "..."
