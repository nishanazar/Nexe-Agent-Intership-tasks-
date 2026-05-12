import os
import json
from dotenv import load_dotenv
from agents import Agent, Runner, function_tool, SQLiteSession, OpenAIChatCompletionsModel, AsyncOpenAI
from ddgs import DDGS
from database import SessionLocal, EmailSent, ToolLog, ChatHistory

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# =========================
load_dotenv()


# =========================
# CLIENT SETUP (xAI Grok)
# =========================
client = AsyncOpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

model = OpenAIChatCompletionsModel(
    model="openrouter/free",
    openai_client=client
)


# =================================================================
# TOOLS DEFINITION
# =================================================================

@function_tool
def send_email(to: str, subject: str, content: str) -> str:
    """
    Sends an email using Gmail SMTP.

    Args:
        to: Recipient email address.
        subject: Email subject line.
        content: HTML content of the email.
    """
    print("send_email tool called")  # Debug log
    # Load fresh from environment in case .env was updated
    load_dotenv()
    gmail_user = os.getenv("GMAIL_USER")
    gmail_password = os.getenv("GMAIL_PASSWORD", "").replace(" ", "")
    
    print(f"DEBUG: Attempting to send email to {to} using {gmail_user}")
    
    db = SessionLocal()
    try:
        # Create message
        msg = MIMEMultipart()
        msg["From"] = gmail_user
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(content, "html"))

        # Log tool call
        tool_log = ToolLog(tool_name="send_email", input=json.dumps({"to": to, "subject": subject}), output="Pending")
        db.add(tool_log)
        db.commit()

        # Connect and send
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(gmail_user, gmail_password)
            server.send_message(msg)

        # Log success
        email_record = EmailSent(recipient=to, subject=subject, content=content, status="sent")
        db.add(email_record)
        tool_log.output = f"Email sent via Gmail to {to}"
        db.commit()

        return f"Successfully sent email to {to} via Gmail."
    except Exception as e:
        # Log failure
        error_msg = str(e)
        print(f"DEBUG: Email failure: {error_msg}")
        db.add(EmailSent(recipient=to, subject=subject, content=content, status=f"failed: {error_msg}"))
        db.commit()
        return f"Failed to send email: {error_msg}"
    finally:
        db.close()

@function_tool
def get_memory(limit: int = 5) -> str:
    print("get_memory tool called")  # Debug log
    """
    Retrieves the recent chat history from the database to provide context.
    
    Args:
        limit: Number of recent messages to retrieve.
    """
    db = SessionLocal()
    try:
        history = db.query(ChatHistory).order_by(ChatHistory.created_at.desc()).limit(limit).all()
        if not history:
            return "No previous history found."
        
        formatted_history = []
        for h in reversed(history):
            formatted_history.append(f"User: {h.user_message}\nAgent: {h.agent_response}")
        
        return "\n---\n".join(formatted_history)
    finally:
        db.close()

# =================================================================
# AGENT CONFIGURATION
# =================================================================

@function_tool
def web_search(query: str) -> str:
    print("web_search tool called")  # Debug log
    """
    Searches the web for real-time information, facts, and current news using DuckDuckGo.

    Args:
        query: The search query to look up.
    """
    print(f"DEBUG: web_search called with query: {query}")
    try:
        with DDGS() as ddgs:
            # Using text search but increasing max_results for more context
            results = ddgs.text(query, max_results=8)
            if not results:
                print(f"DEBUG: No results found for query: {query}")
                return f"No results found for '{query}'."
            
            formatted_results = []
            for r in results:
                formatted_results.append(f"Title: {r['title']}\nSnippet: {r['body']}")
            
            output = "\n\n---\n\n".join(formatted_results)
            print(f"DEBUG: web_search returning {len(results)} results")
            return output
    except Exception as e:
        print(f"DEBUG: Error in web_search: {str(e)}")
        return f"Error performing web search: {str(e)}"

# Initialize the Agent
agent = Agent(
    name="MultiToolAgent",
    instructions=(
        "SYSTEM MANDATE: All email credentials (SMTP/App Password) are ALREADY configured and verified. "
        "1. When asked to send an email, you MUST NOT explain anything or ask for passwords. "
        "2. You MUST call the 'send_email' tool IMMEDIATELY. "
        "3. Only if the tool returns a 'Failed' message should you report an issue. "
        "4. For real-time info, use 'web_search'. "
        "5. For past conversation details, use 'get_memory'. "
        "6. Keep responses very short and natural. Do not give long preambles."
    ),
    model=model,
    tools=[web_search, send_email, get_memory],
)

async def run_agent(user_message: str, session_id: str = "default_session"):
    # Persistent memory via SQLiteSession (builtin SDK feature)
    session = SQLiteSession(session_id=session_id, db_path="./agent_memory.sqlite")
    
    try:
        result = await Runner.run(
            agent,
            input=user_message,
            session=session
        )
        
        # Log to chat_history table
        db = SessionLocal()
        try:
            # Check if session already exists to determine title
            existing_session = db.query(ChatHistory).filter(ChatHistory.session_id == session_id).first()
            
            if existing_session:
                session_title = existing_session.session_title
            else:
                # Generate a simple title from the first message
                session_title = user_message[:30] + ("..." if len(user_message) > 30 else "")

            # Detect if tools were used (simplified)
            tool_used = None
            if "tool_calls" in str(result): # Rough check for tool usage in logs
                tool_used = "Multiple" # In a real scenario, we'd parse exact tool names
            
            chat_record = ChatHistory(
                session_id=session_id,
                session_title=session_title,
                user_message=user_message,
                agent_response=result.final_output,
                tool_used=tool_used
            )
            db.add(chat_record)
            db.commit()
        finally:
            db.close()
            
        return result.final_output
    finally:
        session.close()
