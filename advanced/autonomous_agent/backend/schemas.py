from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class LogBase(BaseModel):
    task_id: int
    level: str
    message: str
    agent_type: str

class LogCreate(LogBase):
    pass

class Log(LogBase):
    id: int
    timestamp: datetime
    class Config:
        from_attributes = True

class SubTaskBase(BaseModel):
    title: str
    order: int

class SubTaskCreate(SubTaskBase):
    task_id: int

class SubTask(SubTaskBase):
    id: int
    task_id: int
    status: str
    result: Optional[str] = None
    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime
    subtasks: List[SubTask] = []
    class Config:
        from_attributes = True

class AgentRunRequest(BaseModel):
    task: str
