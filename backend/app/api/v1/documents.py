from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.document import Document
import uuid, os

router = APIRouter()

# Mock dependency for current user
async def get_current_user():
    # In production, decode JWT and fetch user
    return {"id": "mock-user-id", "tenant_id": "mock-tenant-id"}

@router.post("/upload")
async def upload_document(file: UploadFile = File(...), db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    contents = await file.read()
    storage_path = f"uploads/{user['tenant_id']}/{uuid.uuid4()}.pdf"
    os.makedirs(os.path.dirname(storage_path), exist_ok=True)
    
    with open(storage_path, "wb") as f:
        f.write(contents)
    
    doc = Document(
        tenant_id=uuid.UUID(user['tenant_id']),
        uploaded_by=uuid.UUID(user['id']),
        name=file.filename,
        storage_key=storage_path,
        file_size_bytes=len(contents),
        status="pending"
    )
    db.add(doc)
    await db.commit()
    
    # Trigger background ingestion task here (omitted for brevity)
    
    return {"id": str(doc.id), "status": "pending", "message": "Document uploaded and queued for processing"}
