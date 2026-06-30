# backend/app/api/v1/chat.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid
import re

router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    tenant_id: str = "00000000-0000-0000-0000-000000000001"


def clean_text(text):
    """Remove punctuation and lowercase for matching."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    return set(text.split())


@router.post("/query")
async def chat_query(req: ChatRequest):
    try:
        from app.db.session import AsyncSessionLocal
        from sqlalchemy import select
        from app.models.document import Document

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Document).where(
                    Document.tenant_id == uuid.UUID(req.tenant_id)
                )
            )
            documents = result.scalars().all()

        if not documents:
            return {
                "answer": "No documents found in your knowledge base. Please upload documents on the Dashboard first.",
                "sources": []
            }

        question_words = clean_text(req.question)
        doc_count = len(documents)

        # Find relevant documents
        relevant_docs = []
        for doc in documents:
            name_words = clean_text(doc.name)
            overlap = question_words & name_words
            if overlap:
                relevant_docs.append((doc.name, overlap))

        doc_list = "\n".join([f"- {d.name} (status: {d.status})" for d in documents])

        if relevant_docs:
            matched_names = [f'"{name}"' for name, _ in relevant_docs]
            doc_context = f"I found a relevant document: {', '.join(matched_names)}."

            answer = (
                f"{doc_context}\n\n"
                f"However, I cannot read the actual content of the PDF yet. "
                f"The document status is \"{relevant_docs[0][0].split('(')[-1].strip(')')}\" — "
                f"it has been uploaded but not yet processed.\n\n"
                f"To answer your question \"{req.question}\", you need:\n"
                f"1. PDF text extraction (PyPDF2 / pdfplumber)\n"
                f"2. Text chunking\n"
                f"3. Embedding generation (OpenAI / sentence-transformers)\n"
                f"4. Vector store (pgvector / Pinecone / Qdrant)\n"
                f"5. LLM query with retrieved context\n\n"
                f"Would you like me to build the PDF extraction + embedding pipeline next?"
            )
        else:
            answer = (
                f"I searched through your {doc_count} document(s) but couldn't find "
                f"a match for your question.\n\n"
                f"**Your documents:**\n{doc_list}\n\n"
                f"Try mentioning a specific document name in your question."
            )

        return {
            "answer": answer,
            "sources": [d.name for d in documents],
            "document_count": doc_count
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))