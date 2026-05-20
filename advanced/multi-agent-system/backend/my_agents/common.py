import os
from dotenv import load_dotenv
from agents import AsyncOpenAI, OpenAIChatCompletionsModel

load_dotenv()

# Setup the AI Client (OpenRouter/OpenAI compatible)
client = AsyncOpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

# Initialize the Model
model = OpenAIChatCompletionsModel(
    model="openrouter/free",
    openai_client=client
)
