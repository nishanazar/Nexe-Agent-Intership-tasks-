from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from agent import run_agent

# =================================================================
# FASTAPI APPLICATION SETUP
# =================================================================
app = FastAPI(
    title="Multi-Tool Agent API",
    description="Backend API for the Multi-Tool Agent with Web Search, Neon DB, and Gmail SMTP."
)

# =================================================================
# CORS CONFIGURATION
# =================================================================
# Allows the Next.js frontend (localhost:3000) to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =================================================================
# REQUEST SCHEMA
# =================================================================
class Request(BaseModel):
    message: str

# =================================================================
# API ENDPOINTS
# =================================================================

@app.post("/agent")
async def agent_api(req: Request):
    """
    Main endpoint that processes user messages through the AI Agent.
    Fulfills Requirement: Structured Output (returns JSON).
    """
    response = await run_agent(req.message)
    return {"response": response}

@app.get("/health")
def health_check():
    """Simple endpoint to verify the backend is running."""
    return {"status": "online", "message": "AI Calculator Backend is active"}
