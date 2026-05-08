from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from agent import run_agent

# =================================================================
# FASTAPI APPLICATION SETUP
# =================================================================
app = FastAPI(
    title="AI Calculator Agent API",
    description="Backend API for the AI Calculator with SQLite Memory and Math Tools."
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
def agent_api(req: Request):
    """
    Main endpoint that processes user messages through the AI Agent.
    Fulfills Requirement: Structured Output (returns JSON).
    """
    return run_agent(req.message)

@app.get("/health")
def health_check():
    """Simple endpoint to verify the backend is running."""
    return {"status": "online", "message": "AI Calculator Backend is active"}

@app.get("/")
def home():
    """Home endpoint for the API."""
    return {"message": "Welcome to the AI Calculator Backend!"}
