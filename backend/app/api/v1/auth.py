from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse
from app.core.security import get_password_hash, verify_password
from app.core.jwt import create_access_token
import uuid

router = APIRouter()

@router.post("/signup", response_model=TokenResponse)
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    existing_user = await db.execute(select(User).where(User.email == req.email))
    if existing_user.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create Tenant
    tenant = Tenant(name=req.company_name, slug=req.company_name.lower().replace(" ", "-"))
    db.add(tenant)
    await db.flush()
    
    # Create User
    user = User(
        tenant_id=tenant.id,
        email=req.email,
        password_hash=get_password_hash(req.password),
        name=req.name,
        role="admin"
    )
    db.add(user)
    await db.commit()
    
    token = create_access_token({"sub": str(user.id), "tenant_id": str(tenant.id), "role": "admin"})
    return {"access_token": token, "refresh_token": token, "token_type": "bearer"}

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Get user with tenant
    result = await db.execute(
        select(User).where(User.email == req.email)
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create tokens with tenant_id
    token_data = {
        "sub": str(user.id),
        "tenant_id": str(user.tenant_id),
        "role": user.role
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )