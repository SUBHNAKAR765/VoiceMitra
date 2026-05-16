from app.services.search_service import web_search


def get_news(query: str = "") -> str:
    search_query = f"latest news {query}".strip() if query else "top news headlines today"
    return web_search(search_query)
