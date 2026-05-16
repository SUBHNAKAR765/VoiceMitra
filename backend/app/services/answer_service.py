from datetime import datetime
import random

GREETINGS = [
    "Hello! I'm VoiceVora, your AI voice assistant. How can I help you today?",
    "Hi there! I'm VoiceVora. Ask me anything — weather, news, facts, or any question!",
    "Hey! Great to hear from you. What would you like to know?",
]


def get_greeting() -> str:
    return random.choice(GREETINGS)


def get_time_response() -> str:
    return f"The current time is {datetime.now().strftime('%I:%M %p')}."


def get_date_response() -> str:
    return f"Today is {datetime.now().strftime('%A, %B %d, %Y')}."
