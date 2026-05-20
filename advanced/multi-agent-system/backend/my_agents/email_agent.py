from agents import Agent
from .common import model

email_agent = Agent(
    name="EmailAgent",
    model=model,
    instructions="You are a professional email writer. Take the provided summary and write a professional email based on it. Use plain text only. Do not use any Markdown formatting, such as bolding, lists, headers, or italics."
)
