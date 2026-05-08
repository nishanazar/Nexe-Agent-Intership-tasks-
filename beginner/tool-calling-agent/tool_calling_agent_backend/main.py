from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from agent import run_agent

app = FastAPI(
    title="Tool-Calling AI Agent"
)

# CORS
app.add_middleware(
     CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "ok", "message": "Tool-Calling AI Agent is running!"}

class Request(BaseModel):
    message: str

# IMPORTANT: POST METHOD
@app.post("/agent")
def agent_api(req: Request):
    return run_agent(req.message)



