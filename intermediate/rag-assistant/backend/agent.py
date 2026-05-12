"""
RAG Assistant Backend Logic
This module handles PDF processing, text chunking, embedding generation, 
and the multi-agent orchestration for answering user queries.
"""

import os
import fitz  # PyMuPDF for PDF text extraction
from typing import List, Tuple, Optional
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import chromadb
from openai import AsyncOpenAI
from agents import Agent, Runner, OpenAIChatCompletionsModel, function_tool

# --- CONFIGURATION & ENVIRONMENT ---
load_dotenv()

# Global variables for lazy loading of heavy AI models and databases
# This prevents system hanging during development reloads.
_EMBED_MODEL: Optional[SentenceTransformer] = None
_CHROMA_CLIENT: Optional[chromadb.PersistentClient] = None
_COLLECTION: Optional[chromadb.Collection] = None

def get_resources() -> Tuple[SentenceTransformer, chromadb.Collection]:
    """
    Lazily initialize and return heavy resources (AI Model and Vector DB).
    
    Returns:
        Tuple: (SentenceTransformer model, ChromaDB collection)
    """
    global _EMBED_MODEL, _CHROMA_CLIENT, _COLLECTION
    
    if _EMBED_MODEL is None:
        print("INFO: Loading AI Model (SentenceTransformer 'all-MiniLM-L6-v2')...")
        _EMBED_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
        
    if _CHROMA_CLIENT is None:
        print("INFO: Connecting to ChromaDB...")
        # Database files are stored in the 'chroma_db' directory
        _CHROMA_CLIENT = chromadb.PersistentClient(path="./chroma_db")
        _COLLECTION = _CHROMA_CLIENT.get_or_create_collection(name="pdf_docs")
        
    return _EMBED_MODEL, _COLLECTION

# Initialize OpenAI Client (pointing to OpenRouter for cost-effective LLM access)
openai_client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

# Configure the LLM model (using OpenRouter's auto-model selection)
llm_model = OpenAIChatCompletionsModel(
    model="openrouter/auto",
    openai_client=openai_client
)

# --- PDF PROCESSING UTILITIES ---

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts raw text from a PDF file using PyMuPDF.
    
    Args:
        file_path: Path to the PDF file.
    Returns:
        Extracted text as a string.
    """
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text

def chunk_text(text: str) -> List[str]:
    """
    Splits long text into smaller chunks for better RAG retrieval.
    
    Args:
        text: The raw text to be split.
    Returns:
        List of text chunks.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,      # Characters per chunk
        chunk_overlap=50,    # Overlap to maintain context between chunks
        length_function=len,
    )
    return text_splitter.split_text(text)

def process_pdf(file_path: str, filename: str) -> int:
    """
    Full pipeline: Extracts text, chunks it, generates embeddings, and stores in ChromaDB.
    
    Args:
        file_path: Local path to the uploaded PDF.
        filename: Original name of the file for metadata.
    Returns:
        The number of chunks processed and stored.
    """
    embed_model, collection = get_resources()
    
    # 1. Extract and Chunk
    text = extract_text_from_pdf(file_path)
    chunks = chunk_text(text)
    
    # 2. Generate Embeddings (Mathematical representations of text meaning)
    embeddings = embed_model.encode(chunks).tolist()
    
    # 3. Store in Vector Database
    ids = [f"{filename}_{i}" for i in range(len(chunks))]
    metadatas = [{"source": filename} for _ in range(len(chunks))]
    
    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas
    )
    return len(chunks)

# --- AI AGENT TOOLS ---

@function_tool
def search_documents(query: str) -> str:
    """
    Search the uploaded PDF documents for relevant information.
    Use this tool whenever the user asks about the content of their documents.
    
    Args:
        query: The search term or question to look up in the database.
    Returns:
        Relevant text snippets found in the documents.
    """
    embed_model, collection = get_resources()
    
    # Convert query to vector and search for top 3 similar chunks
    query_embedding = embed_model.encode([query]).tolist()
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=3
    )
    
    if not results['documents'] or not results['documents'][0]:
        return "No relevant information found in the documents."
    
    # Combine the top results into a single context string
    context = "\n".join(results['documents'][0])
    return context

# --- AI AGENT DEFINITION ---

rag_assistant = Agent(
    name="RAGAssistant",
    instructions="""
    You are a professional AI Assistant specialized in document analysis.
    
    CORE RULES:
    1. If the user asks about document content, ALWAYS use 'search_documents' first.
    2. Be concise, accurate, and professional.
    3. If information is missing from documents, state that clearly.
    
    LANGUAGE RESTRICTION:
    - You must ONLY respond in Urdu or English.
    - NEVER respond in Hindi.
    """,
    tools=[search_documents],
    model=llm_model
)

# --- PUBLIC API ---

async def get_answer(question: str) -> str:
    """
    Orchestrates the agent to process a user question and return an answer.
    
    Args:
        question: User's input message.
    Returns:
        AI generated response string.
    """
    # Run the multi-turn agent loop
    result = await Runner.run(rag_assistant, question)
    return result.final_output
