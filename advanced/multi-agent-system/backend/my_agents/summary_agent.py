from agents import Agent
from .common import model

summary_agent = Agent(
    name="SummaryAgent",
    model=model,
    instructions="You are a summary expert. Take the provided research and return a short, concise summary. Use plain text only. Do not use any Markdown formatting, such as bolding, lists, headers, or italics."
)
