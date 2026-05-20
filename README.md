# 🤖 Nexe Agent Internship - AI Agent Repository

A collection of professional AI Agent prototypes ranging from basic tool-calling to advanced multi-agent autonomous systems. Built using **FastAPI**, **Next.js**, and various AI SDKs.

## 📂 Repository Structure

### 🟢 Beginner Level
Focuses on core tool-calling architecture and basic persistent memory.
- **[AI Calculator Agent](./beginner/ai-calculator-agent):** Persistent numeric memory (SQLite) and math operations.
- **[Tool-Calling Agent](./beginner/tool-calling-agent):** Weather-fetching agent demonstrating strict JSON responses.

### 🟡 Intermediate Level
Introduces multi-tool integration and Retrieval-Augmented Generation (RAG).
- **[Multi-Tool Agent](./intermediate/multi-tool-agent):** Conversational assistant with email tools and session history.
- **[RAG Assistant](./intermediate/rag-assistant):** PDF-based AI chat using ChromaDB for contextual document retrieval.

### 🔴 Advanced Level
Complex workflows featuring autonomous orchestration and real-time feedback.
- **[Autonomous Business Agent](./advanced/autonomous_agent):** Multi-agent system (Planner, Executor, Reflector) with WebSocket-streamed logs.
- **[Multi-Agent System (AgentOS)](./advanced/multi-agent-system):** Modular pipeline for research, summarization, and email drafting.

---

## 🛠️ Tech Stack
- **Backend:** Python (FastAPI), OpenAI Agents SDK, SQLAlchemy/SQLite, ChromaDB.
- **Frontend:** Next.js (TypeScript), Tailwind CSS / Vanilla CSS, Zustand.
- **AI Models:** Gemini 2.0, Qwen 2.5, Grok (via OpenRouter/xAI).

## 🚀 Quick Start
Each project contains its own `README.md` with specific setup instructions. Generally:
1. **Backend:** Install requirements and configure `.env` with your API keys.
2. **Frontend:** Install npm packages and run the development server.

---
*Created as part of the Nexe_agent Internship program.*
