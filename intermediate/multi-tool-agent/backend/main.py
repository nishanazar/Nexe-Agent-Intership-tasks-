from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import uvicorn
import logging
from sqlalchemy.orm import Session
from sqlalchemy import func

# Local imports
from database import init_db, get_db, ChatHistory, ToolLog
from agent import run_agent, send_email as agent_send_email

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Multi-Tool Agent API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to your specific frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    """Initialize database tables on app startup."""
    init_db()
    logger.info("Database initialized.")

# --- Models ---

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    session_id: str

class ChatResponse(BaseModel):
    response: str

class EmailRequest(BaseModel):
    to: str
    subject: str
    content: str

# --- Endpoints ---

@app.get("/", tags=["General"])
async def root():
    return {"message": "Welcome to the Multi-Tool Agent API"}

@app.get("/health", tags=["General"])
async def health_check():
    return {"status": "healthy"}

@app.post("/chat", response_model=ChatResponse, tags=["Agent"])
async def chat_endpoint(request: ChatRequest):
    """Process a user message and return agent response."""
    try:
        response_text = await run_agent(request.message, request.session_id)
        return ChatResponse(response=response_text)
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process agent message."
        )

@app.get("/history", tags=["History"])
async def get_history(db: Session = Depends(get_db)):
    """Retrieve list of unique chat sessions."""
    try:
        subquery = db.query(
            ChatHistory.session_id,
            func.max(ChatHistory.created_at).label("latest_msg")
        ).group_by(ChatHistory.session_id).subquery()

        sessions = db.query(
            ChatHistory.session_id,
            ChatHistory.session_title,
            ChatHistory.created_at
        ).join(
            subquery,
            (ChatHistory.session_id == subquery.c.session_id) & 
            (ChatHistory.created_at == subquery.c.latest_msg)
        ).order_by(ChatHistory.created_at.desc()).all()

        return [
            {"session_id": s.session_id, "session_title": s.session_title, "created_at": s.created_at}
            for s in sessions
        ]
    except Exception as e:
        logger.error(f"History fetch error: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch history")

@app.get("/history/{session_id}", tags=["History"])
async def get_session_history(session_id: str, db: Session = Depends(get_db)):
    """Retrieve messages for a specific session."""
    messages = db.query(ChatHistory).filter(ChatHistory.session_id == session_id).order_by(ChatHistory.created_at.asc()).all()
    if not messages:
        return []
    return [
        {
            "id": m.id,
            "user_message": m.user_message,
            "agent_response": m.agent_response,
            "session_title": m.session_title,
            "created_at": m.created_at
        }
        for m in messages
    ]

@app.delete("/history/{session_id}", tags=["History"])
async def delete_session(session_id: str, db: Session = Depends(get_db)):
    """Delete all messages associated with a session ID."""
    items = db.query(ChatHistory).filter(ChatHistory.session_id == session_id).all()
    if not items:
        raise HTTPException(status_code=404, detail="Session not found")
    
    for item in items:
        db.delete(item)
    db.commit()
    return {"message": "Session deleted successfully"}

@app.post("/send-email", tags=["Agent"])
async def manual_send_email(request: EmailRequest):
    """Manually trigger email sending."""
    result = agent_send_email(request.to, request.subject, request.content)
    if "Failed" in result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result)
    return {"message": result}

@app.get("/logs", tags=["Admin"])
async def get_logs(db: Session = Depends(get_db)):
    """Retrieve system logs."""
    return db.query(ToolLog).order_by(ToolLog.created_at.desc()).all()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
