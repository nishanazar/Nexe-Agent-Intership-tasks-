import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./agent.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    session_title = Column(String, nullable=True)
    user_message = Column(Text)
    agent_response = Column(Text)
    tool_used = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class EmailSent(Base):
    __tablename__ = "emails_sent"
    id = Column(Integer, primary_key=True, index=True)
    recipient = Column(String)
    subject = Column(String)
    content = Column(Text)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ToolLog(Base):
    __tablename__ = "tool_logs"
    id = Column(Integer, primary_key=True, index=True)
    tool_name = Column(String)
    input = Column(Text)
    output = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
