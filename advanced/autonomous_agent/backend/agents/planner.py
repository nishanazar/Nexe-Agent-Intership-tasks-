import os
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()
# Setup the AI Client for OpenRouter
client = AsyncOpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

MODEL_NAME = "openrouter/free"

class PlannerAgent:
    async def plan_task(self, task_description: str, retries: int = 2):
        """
        Breaks down a task into 3-5 subtasks using a stable model.
        """
        system_prompt = "You are an AI assistant that ONLY outputs a JSON list of objects with 'title' (string) and 'order' (integer). No conversational text."
        user_prompt = f"""
        Break down the following task into 3-5 clear, actionable subtasks.
        Task: {task_description}

        Return ONLY a JSON list:
        [
            {{"title": "Subtask 1", "order": 1}},
            {{"title": "Subtask 2", "order": 2}}
        ]
        """

        for attempt in range(retries + 1):
            try:
                response = await client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    timeout=30.0
                )

                content = response.choices[0].message.content
                if not content: continue

                # Clean and Parse JSON
                content = content.replace("```json", "").replace("```", "").strip()
                start = content.find('[')
                end = content.rfind(']')
                if start != -1 and end != -1:
                    data = json.loads(content[start:end+1])
                    if isinstance(data, list):
                        return data
            except Exception as e:
                print(f"Planner attempt {attempt + 1} failed: {e}")
                if attempt == retries: return None
        
        return None
