import uuid
from sqlalchemy import Column, String, Integer, BigInteger, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class Document(Base):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    name = Column(String(500), nullable=False)
    storage_key = Column(String(1000), nullable=False)
    file_size_bytes = Column(BigInteger, nullable=False)
    status = Column(String(20), default="pending")
    page_count = Column(Integer, nullable=True)
