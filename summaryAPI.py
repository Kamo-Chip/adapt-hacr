from fastapi import FastAPI
import ollama
import re

app = FastAPI()

#Define an endpoint - a URL on the internet that we can access
@app.post("/query")
def query(prompt: str):
    response = ollama.chat(model="qwen3:8b", messages=[{"role":"user", "content":"/no_think Summarise this : {} /no_think".format(prompt)}])
    raw_text = response["message"]["content"]
    
    # Remove <think>...</think> (including newlines)
    clean_text = re.sub(r"<think>.*?</think>", "", raw_text, flags=re.DOTALL).strip()
    
    return {"response": clean_text}

