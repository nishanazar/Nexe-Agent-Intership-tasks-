# Multi-Agent System (AgentOS)

AgentOS is an intelligent, multi-agent workflow orchestration engine designed to automate complex tasks. It employs a modular architecture where specialized agents handle specific stages of a pipeline, orchestrated by a central management engine.

## Key Features

- **Separate Agents:** Dedicated agents for Research, Summarization, and Email drafting.
- **Task Delegation:** Intelligent orchestration that routes tasks based on requirements.
- **Communication Layer:** Seamless data flow and context sharing between agents.
- **Professional Dashboard:** ChatGPT-style interface with real-time status monitoring.

## Architecture

- **Frontend:** Next.js (TypeScript/Tailwind CSS) providing a modern chat-like interface.
- **Backend:** FastAPI (Python) serving as the API bridge and workflow manager.
- **Orchestration:** Async agent pipeline using the `agents` framework for LLM interaction.

## Prerequisites

- Node.js (v18+)
- Python (v3.10+)
- OpenRouter API Key (or compatible OpenAI-based provider)

## Setup Instructions

### 1. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Create a .env file with OPENROUTER_API_KEY
uvicorn main:app --reload
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

## How to Test
1. Access the dashboard at `http://localhost:3000`.
2. Use the following prompt to trigger the full multi-agent pipeline:
   > *"Research about the future of Artificial Intelligence in healthcare, provide a concise summary, and draft a professional email to my boss highlighting the key takeaways."*
3. Watch the backend terminal logs to see agents delegating tasks in real-time.

---
*Developed for Nexe_agent Internship.*
