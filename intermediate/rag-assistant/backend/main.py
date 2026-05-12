"""
FastAPI Server for RAG Assistant
This module defines the API endpoints for uploading PDFs and chatting with the AI agent.
"""

import os
import shutil
import traceback
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables (API Keys, etc.)
load_dotenv()

# Import business logic from agent module
# Note: Heavy resources are lazily loaded inside these functions
from agent import process_pdf, get_answer

# --- APP INITIALIZATION ---

app = FastAPI(
    title="RAG Assistant API",
    description="Backend for the PDF-based Retrieval-Augmented Generation Assistant"
)

# CORS (Cross-Origin Resource Sharing) Configuration
# Required to allow the Next.js frontend (localhost:3000) to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure the uploads directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- DATA MODELS ---

class ChatRequest(BaseModel):
    """Schema for incoming chat messages."""
    message: str

# --- API ENDPOINTS ---

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Endpoint to upload and process a PDF file.
    The file is saved temporarily, processed into chunks/embeddings, and then deleted.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        # 1. Save the file temporarily
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 2. Process the PDF (Chunking, Embedding, Storing)
        num_chunks = process_pdf(file_path, file.filename)
        
        return {
            "message": f"Successfully uploaded and processed {file.filename}",
            "chunks": num_chunks
        }
    except Exception as e:
        print(f"CRITICAL: Upload Error -> {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error during file processing.")
    finally:
        # 3. Clean up: Remove the temporary file to save space
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/agent")
async def chat(req: ChatRequest):
    """
    Main chat endpoint. Receives a message, queries the RAG agent, and returns the response.
    """
    try:
        print(f"LOG: Processing message -> {req.message}")
        
        # Get response from the AI Agent
        answer = await get_answer(req.message)
        
        return {"text": answer}
    except Exception as e:
        print(f"CRITICAL: Agent Error -> {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error during chat processing.")

@app.get("/health")
def health_check():
    """Simple health check endpoint for monitoring."""
    return {"status": "online", "service": "RAG Assistant API"}

@app.get("/")
def home():
    """Welcome message for the API root."""
    return {"message": "Welcome to the RAG Assistant API. Access /docs for API documentation."}
