import asyncio
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List

from database import get_db, init_db
from models import Task, Log
import schemas
from websocket import manager
from agents.orchestrator import AgentOrchestrator

app = FastAPI(title="Autonomous Business Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def home():
    return {"message": "Welcome to the Autonomous Business Agent API"}

@app.get("/doc")
async def doc_redirect():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")

@app.on_event("startup")
def startup():
    init_db()

@app.post("/agent/run", response_model=schemas.Task)
async def run_agent(
    request: schemas.AgentRunRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Create the task
    task = Task(title=request.task, status="pending")
    db.add(task)
    db.commit()
    db.refresh(task)
    
    # Run orchestrator in background
    # We pass the task ID, orchestrator will open its own DB session
    orchestrator = AgentOrchestrator()
    background_tasks.add_task(orchestrator.run, task.id)
    
    return task

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        return {"error": "Task not found"}
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}

@app.get("/tasks", response_model=List[schemas.Task])
async def get_tasks(db: Session = Depends(get_db)):
    tasks = db.query(Task).order_by(Task.created_at.desc()).all()
    print(f"Returning {len(tasks)} tasks")
    return tasks

@app.get("/logs/{task_id}", response_model=List[schemas.Log])
async def get_logs(task_id: int, db: Session = Depends(get_db)):
    logs = db.query(Log).where(Log.task_id == task_id).order_by(Log.timestamp.asc()).all()
    return logs

@app.websocket("/ws/logs")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
