# 🤖 RAG Assistant (PDF-based AI Chat)

A modern, professional Retrieval-Augmented Generation (RAG) application that allows users to upload PDF documents and have contextual conversations with an AI assistant. Built with **Next.js**, **FastAPI**, **ChromaDB**, and **OpenRouter**.

---

## 🚀 Features

- **ChatGPT-style UI**: Integrated file attachment and chat interface.
- **Contextual Knowledge**: Upload any PDF to expand the AI's knowledge base.
- **Fast Search**: Uses ChromaDB vector database for efficient document retrieval.
- **Multilingual Support**: Responds strictly in **Urdu** or **English** (as configured).
- **Resource Optimized**: Implements lazy loading for heavy AI models to save system resources.
- **Surgical RAG Pipeline**:
  - Text extraction via `PyMuPDF`.
  - Intelligent chunking using `RecursiveCharacterTextSplitter`.
  - Local embeddings via `SentenceTransformers`.
  - LLM orchestration via `openai-agents`.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS / Styled-jsx
- **Icons**: SVG-based custom icons

### Backend
- **Framework**: FastAPI
- **Database**: ChromaDB (Vector Store)
- **AI Models**: 
  - `all-MiniLM-L6-v2` (Local Embeddings)
  - `OpenRouter/Auto` (Cloud LLM)
- **Agents**: `openai-agents` for tool-use and orchestration.

---

## 📦 Project Structure

```text
rag-assistant/
├── backend/            # FastAPI Application
│   ├── agent.py        # Core RAG logic & AI Agents
│   ├── main.py         # API Endpoints
│   ├── chroma_db/      # Vector database storage
│   └── requirements.txt
└── frontend/           # Next.js Application
    ├── app/            # Main UI pages
    └── package.json
```

---

## ⚙️ Setup Instructions

### 1. Backend Setup
1. **Navigate to backend**:
   ```bash
   cd backend
   ```
2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Environment Variables**:
   Create a `.env` file in `backend/` and add your keys:
   ```env
   OPENROUTER_API_KEY=your_key_here
   OPENAI_API_KEY=your_key_here  # Required for agent tracing
   ```
4. **Run Server**:
   ```bash
   uvicorn main:app --reload
   ```

### 2. Frontend Setup
1. **Navigate to frontend**:
   ```bash
   cd frontend
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run Development Server**:
   ```bash
   npm run dev
   ```

---

## 📖 Usage Guide

1. **Upload**: Click the paperclip icon (`📎`) in the chat input and select a PDF file.
2. **Process**: Click the "Upload" button. The AI will process the text and confirm once updated.
3. **Ask**: Type a question about the document. The AI will search the file and provide a contextual answer.
4. **Language**: The assistant will respond in Urdu or English as requested.

---

## 🛡️ Privacy & Safety
- **Local Embeddings**: Your document text is converted to vectors locally on your machine.
- **Selective Context**: Only the most relevant parts of your document are sent to the LLM (OpenRouter) to generate an answer.
- **Temporary Storage**: Uploaded files are deleted from the server immediately after processing.

---

## 📝 License
This project is for educational/internship purposes. Feel free to modify and expand!
