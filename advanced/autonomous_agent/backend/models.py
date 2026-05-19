from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="pending") # pending, planning, executing, reflecting, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    subtasks = relationship("SubTask", back_populates="task", cascade="all, delete-orphan")
    logs = relationship("Log", back_populates="task", cascade="all, delete-orphan")

class SubTask(Base):
    __tablename__ = "subtasks"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    title = Column(String, nullable=False)
    status = Column(String, default="pending") # pending, completed, failed
    result = Column(Text, nullable=True)
    order = Column(Integer)
    
    task = relationship("Task", back_populates="subtasks")

class Log(Base):
    __tablename__ = "logs"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    level = Column(String, default="info") # info, warning, error, success
    message = Column(Text, nullable=False)
    agent_type = Column(String) # planner, executor, reflector, system
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    task = relationship("Task", back_populates="logs")

class Memory(Base):
    __tablename__ = "memory"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
