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

class ReflectorAgent:
    async def reflect_on_results(self, task_description: str, execution_results: str, retries: int = 2):
        """
        Validates the execution results against the original goal.
        """
        system_prompt = "You are a Reflection Agent that outputs ONLY JSON."
        user_prompt = f"""
        Validate these results against the goal.
        Goal: {task_description}
        Results: {execution_results}
        
        Check if the model hallucinated or ignored constraints (like time or budget).
        Return ONLY JSON: {{"summary": "...", "success": true/false}}
        """
        
        for attempt in range(retries + 1):
            try:
                response = await client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    timeout=40.0
                )
                
                content = response.choices[0].message.content
                if not content: continue

                content = content.replace("```json", "").replace("```", "").strip()
                start = content.find('{')
                end = content.rfind('}')
                if start != -1 and end != -1:
                    result = json.loads(content[start:end+1])
                    return {
                        "summary": result.get("summary", "No summary provided."),
                        "success": result.get("success", False)
                    }
            except Exception as e:
                print(f"Reflector attempt {attempt + 1} failed: {e}")
                if attempt == retries: break

        return {"summary": "Error: Reflection failed to process.", "success": False}
