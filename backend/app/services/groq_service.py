import logging
from groq import Groq
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

SYSTEM_PROMPT = """You are VoiceVora, a smart and friendly AI voice assistant.
You give concise, natural, conversational answers — as if speaking aloud.
- Keep responses under 3 sentences unless more detail is truly needed.
- Never use markdown, bullet points, or formatting — plain spoken text only.
- If given factual context (weather data, news, search results), use it to answer accurately.
- If you don't know something, say so honestly and briefly.
- Be warm, helpful, and direct."""


def ask_groq(
    user_query: str,
    context: str = "",
    conversation_history: list[dict] = None,
    language: str = "en",
) -> str:
    """
    Send a query to Groq LLM and return the response text.

    Args:
        user_query: The user's question/transcript.
        context: Optional factual context (weather data, news, search snippets).
        conversation_history: List of prior {"role": ..., "content": ...} messages.
    """
    if not settings.groq_api_key:
        return _fallback(context, user_query)

    try:
        client = Groq(api_key=settings.groq_api_key)

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        if language and language != "en":
            messages.append({"role": "system", "content": f"Always respond in the language with ISO code '{language}'. Do not switch languages."})

        # Inject prior conversation (last 6 turns max to stay within token limits)
        if conversation_history:
            messages.extend(conversation_history[-6:])

        # Build the user message — include context if available
        if context:
            user_content = f"Context information:\n{context}\n\nUser question: {user_query}"
        else:
            user_content = user_query

        messages.append({"role": "user", "content": user_content})

        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=messages,
            max_tokens=300,
            temperature=0.7,
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        logger.error(f"Groq API error: {e}")
        # If Groq fails but we have context, return a trimmed version of it
        return _fallback(context, user_query)


def _fallback(context: str, query: str) -> str:
    """Return context directly if Groq is unavailable."""
    if context:
        return context[:450]
    return "I'm sorry, I couldn't process that request right now. Please try again."
