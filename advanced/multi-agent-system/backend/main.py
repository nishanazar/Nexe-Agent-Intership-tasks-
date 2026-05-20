from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from my_agents.manager import run_multi_agent_pipeline

app = FastAPI(title="Multi-Agent System API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskRequest(BaseModel):
    task: str

@app.post("/run-task")
async def run_task(req: TaskRequest):
    print(f"Received task: {req.task}")
    result = await run_multi_agent_pipeline(req.task)
    return {"result": result}

@app.get("/health")
def health_check():
    return {"status": "online"}
