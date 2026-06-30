# backend/app/api/v1/documents.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from app.db.session import get_db
from app.models.document import Document
from app.models.tenant import Tenant
from app.models.user import User

router = APIRouter()

DEMO_TENANT_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEMO_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")


async def ensure_demo_exists(db: AsyncSession):
    """Only creates demo data if it doesn't exist. No rollback mess."""
    tenant = (await db.execute(
        select(Tenant).where(Tenant.id == DEMO_TENANT_ID)
    )).scalar_one_or_none()

    user = (await db.execute(
        select(User).where(User.id == DEMO_USER_ID)
    )).scalar_one_or_none()

    if not tenant:
        tenant = Tenant(id=DEMO_TENANT_ID, name="Demo Organization", slug="demo-org")
        db.add(tenant)
        await db.flush()

    if not user:
        from app.core.security import get_password_hash
        user = User(
            id=DEMO_USER_ID,
            tenant_id=DEMO_TENANT_ID,
            email="demo@rag.local",
            password_hash=get_password_hash("demo123"),
            name="Demo User",
            role="admin"
        )
        db.add(user)
        await db.flush()

    await db.commit()
    return tenant.id, user.id


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    try:
        tenant_id, user_id = await ensure_demo_exists(db)
        storage_key = f"uploads/{tenant_id}/{uuid.uuid4()}_{file.filename}"

        doc = Document(
            id=uuid.uuid4(),
            name=file.filename,
            tenant_id=tenant_id,
            uploaded_by=user_id,
            storage_key=storage_key,
            file_size_bytes=file.size if file.size else 0,
            status="pending"
        )
        db.add(doc)
        await db.commit()
        await db.refresh(doc)

        return {
            "message": "File uploaded successfully",
            "filename": doc.name,
            "document_id": str(doc.id)
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def list_documents(
    db: AsyncSession = Depends(get_db),
):
    """Simple select — no demo user creation needed."""
    try:
        result = await db.execute(
            select(Document).where(Document.tenant_id == DEMO_TENANT_ID)
        )
        docs = result.scalars().all()

        return [
            {
                "id": str(d.id),
                "filename": d.name,
                "status": d.status,
                "created_at": None,
            }
            for d in docs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(Document).where(
                Document.id == uuid.UUID(document_id),
                Document.tenant_id == DEMO_TENANT_ID
            )
        )
        doc = result.scalar_one_or_none()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        await db.delete(doc)
        await db.commit()
        return {"message": "Document deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))