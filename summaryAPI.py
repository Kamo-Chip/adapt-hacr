from fastapi import FastAPI
from pydantic import BaseModel
import requests
import re

app = FastAPI()

OLLAMA_API = "https://1f51630e54e1.ngrok-free.app "

class QueryRequest(BaseModel):
    prompt: str

@app.post("/query")
def query(request: QueryRequest):
    # Call your remote Ollama instance via ngrok
    response = requests.post(
        f"{OLLAMA_API}/api/chat",
        json={
            "model": "qwen3:8b",
            "messages": [
                {
                    "role": "user",
                    "content": f"/no_think Summarise this : {request.prompt} /no_think"
                }
            ]
        },
        timeout=60
    )

    response.raise_for_status()
    data = response.json()

    raw_text = data["message"]["content"]

    # Remove <think>...</think> (including newlines)
    clean_text = re.sub(r"<think>.*?</think>", "", raw_text, flags=re.DOTALL).strip()

    return {"response": clean_text}
