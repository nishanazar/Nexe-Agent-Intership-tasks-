import os
import json
import asyncio
from dotenv import load_dotenv
from agents import Agent, Runner, function_tool, OpenAIChatCompletionsModel, AsyncOpenAI
from duckduckgo_search import DDGS
import psycopg2
import smtplib
from email.mime.text import MIMEText

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

# Setup the AI Client
client = AsyncOpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

# Initialize the Model
model = OpenAIChatCompletionsModel(
    model="qwen/qwen-2.5-7b-instruct",
    openai_client=client
)

# =================================================================
# TOOLS
# =================================================================

@function_tool
def web_search(query: str) -> str:
    """
    Searches the web for the given query using DuckDuckGo.
    Use this when the user asks for current information or something you don't know.
    """
    print(f"DEBUG: Searching web for '{query}'...")
    try:
        with DDGS() as ddgs:
            results = [r for r in ddgs.text(query, max_results=5)]
        return json.dumps(results)
    except Exception as e:
        return f"Error performing search: {str(e)}"

@function_tool
def save_to_db(content: str) -> str:
    """
    Saves the provided content to the Neon database.
    Use this when the user asks to save information or data.
    """
    print(f"DEBUG: Saving to DB: {content[:50]}...")
    db_url = os.getenv("NEON_DATABASE_URL")
    if not db_url:
        return "Error: NEON_DATABASE_URL not configured."
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        # Create table if not exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS agent_data (
                id SERIAL PRIMARY KEY, 
                content TEXT, 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute("INSERT INTO agent_data (content) VALUES (%s)", (content,))
        conn.commit()
        cur.close()
        conn.close()
        return "Successfully saved to database."
    except Exception as e:
        return f"Error saving to database: {str(e)}"

@function_tool
def send_email(recipient: str, subject: str, body: str) -> str:
    """
    Sends an email using Gmail SMTP.
    Use this when the user asks to send an email.
    """
    print(f"DEBUG: Sending email to {recipient}...")
    sender = os.getenv("GMAIL_USER")
    password = os.getenv("GMAIL_PASSWORD")
    if not sender or not password:
        return "Error: GMAIL_USER or GMAIL_PASSWORD not configured."
    
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = sender
    msg['To'] = recipient

    try:
        # Using SMTP_SSL for port 465
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender, password)
            server.send_message(msg)
        return "Email sent successfully."
    except Exception as e:
        return f"Error sending email: {str(e)}"

# =================================================================
# AGENT SETUP
# =================================================================

multi_tool_agent = Agent(
    name="Multi-Tool Agent",
    model=model,
    instructions="""
    You are a powerful Multi-Tool Agent. 
    You can search the web, save data to a database, and send emails.
    Be concise and helpful. If a user asks to do multiple things, do them sequentially.
    """,
    tools=[web_search, save_to_db, send_email]
)

# =================================================================
# EXECUTION LOGIC
# =================================================================

async def run_agent(message: str):
    """
    Async function to run the agent.
    """
    result = await Runner.run(multi_tool_agent, message)
    return result.final_output
