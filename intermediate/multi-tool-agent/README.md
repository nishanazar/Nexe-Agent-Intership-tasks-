# AI Multi-Tool Agent

A full-stack AI assistant application that integrates conversational capabilities, email functionality, and persistent session memory using a FastAPI backend and a modern Next.js frontend.

## 🚀 Features

- **Conversational AI**: Powered by OpenAI Agents SDK.
- **Persistent Memory**: Saves conversation history using SQLite.
- **Tools**: Integrated tools for searching and sending emails.
- **History Management**: View, load, and delete past chat sessions.
- **Modern UI**: Responsive, dark-mode interface built with Next.js and Tailwind CSS.

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI
- **Database**: SQLite (SQLAlchemy ORM)
- **Server**: Uvicorn

### Frontend
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## ⚙️ Prerequisites

- Python 3.10+
- Node.js 18+
- [Add any other API keys required, e.g., OPENAI_API_KEY]

## 📥 Setup Instructions

### 1. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   python main.py
   ```

### 2. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📡 API Documentation
Once the backend is running, you can access the interactive Swagger documentation at:
`http://localhost:8000/docs`


