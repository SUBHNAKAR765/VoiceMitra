import re
import requests
import logging

logger = logging.getLogger(__name__)

WIKI_API = "https://en.wikipedia.org/api/rest_v1/page/summary"


def get_wiki_summary(query: str) -> str:
    topic = _extract_topic(query)
    if not topic:
        return "I'm not sure what you'd like to know about. Could you be more specific?"

    try:
        resp = requests.get(f"{WIKI_API}/{requests.utils.quote(topic)}", timeout=5)
        if resp.status_code == 404:
            return f"I couldn't find information about '{topic}' on Wikipedia."
        resp.raise_for_status()
        data = resp.json()

        extract = data.get("extract", "")
        if not extract:
            return f"I found a page for '{topic}' but it has no summary."

        # Return first 2 sentences max
        sentences = re.split(r"(?<=[.!?])\s+", extract)
        summary = " ".join(sentences[:2])
        return summary
    except Exception as e:
        logger.error(f"Wikipedia error: {e}")
        return "I couldn't fetch that information right now."


def _extract_topic(query: str) -> str:
    patterns = [
        r"who is (.+)",
        r"what is (.+)",
        r"tell me about (.+)",
        r"explain (.+)",
        r"define (.+)",
        r"describe (.+)",
        r"history of (.+)",
        r"facts about (.+)",
    ]
    lower = query.lower().strip().rstrip("?.")
    for pattern in patterns:
        match = re.search(pattern, lower)
        if match:
            return match.group(1).strip().title()
    return query.strip().title()
