import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()
# Setup the AI Client for OpenRouter
client = AsyncOpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

# Best Practice: Use a specific stable model instead of a generic "free" router
# Gemini 2.0 Flash Lite is extremely fast and reliable for free tiers.
MODEL_NAME = "openrouter/free"

class ExecutorAgent:
    async def execute_subtask(self, subtask_title: str, context: str = "", retries: int = 2):
        """
        Executes a specific subtask with retry logic and constraint reinforcement.
        """
        prompt = f"""
        You are an Execution Agent. Your goal is to perform the following subtask.
        
        Subtask: {subtask_title}
        Context (previous results): {context}
        
        STRICT RULES:
        1. Stick ONLY to the business type and goals mentioned in the context.
        2. Provide a CONCISE result using clear bullet points. 
        3. Limit your response to 150-200 words max. 
        4. Do NOT hallucinate unrelated business details.
        """
        
        for attempt in range(retries + 1):
            try:
                response = await client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=[{"role": "system", "content": prompt}],
                    timeout=45.0 # Set a reasonable timeout
                )
                
                if response.choices and response.choices[0].message.content:
                    return response.choices[0].message.content.strip()
                
            except Exception as e:
                print(f"Executor attempt {attempt + 1} failed: {e}")
                if attempt == retries:
                    return f"Error: Model failed to respond after multiple attempts. ({str(e)})"
                continue
                
        return "Error: Model returned empty execution result."
