from agents import Agent
from .common import model

research_agent = Agent(
    name="ResearchAgent",
    model=model,
    instructions="You are a professional researcher. Provide detailed and factual information about the given topic. Use plain text only. Do not use any Markdown formatting, such as bolding, lists, headers, or italics."
)
