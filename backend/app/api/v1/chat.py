from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
import json

router = APIRouter()

@router.post("/sessions/{session_id}/messages")
async def send_message(session_id: str, payload: dict):
    user_query = payload.get("query", "")
    
    async def event_stream():
        # 1. Generate embedding (Mocked)
        # 2. Query ChromaDB (Mocked)
        # 3. Call Gemini with context (Mocked streaming)
        
        mock_response_chunks = [
            "Based on the provided context, ",
            "the answer to your question is... ",
            "\n\n[Source: mock_doc.pdf, Page 1]"
        ]
        
        for chunk in mock_response_chunks:
            yield f"data: {json.dumps({'token': chunk})}\n\n"
            
        yield f"data: {json.dumps({'done': True, 'citations': [{'doc': 'mock_doc.pdf', 'page': 1}]})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
