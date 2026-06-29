"""
Auth routes: POST /register, POST /login, GET /me
"""
from fastapi import APIRouter, HTTPException, Depends, status
from psycopg2.extras import RealDictCursor

from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password,
    create_access_token, get_current_user,
)
from app.models.schemas import (
    RegisterRequest, LoginRequest,
    TokenResponse, UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: RealDictCursor = Depends(get_db)):
    # Check duplicate email
    db.execute("SELECT id FROM users WHERE email = %s", (payload.email,))
    if db.fetchone():
        raise HTTPException(status_code=400, detail="Email already registered")

    pw_hash = hash_password(payload.password)
    db.execute(
        """INSERT INTO users (name, email, phone, password_hash, role, address)
           VALUES (%s, %s, %s, %s, %s, %s)
           RETURNING *""",
        (payload.name, payload.email, payload.phone,
         pw_hash, payload.role.value, payload.address),
    )
    user = dict(db.fetchone())

    token = create_access_token({"sub": str(user["id"]), "role": user["role"]})
    return TokenResponse(access_token=token, user=UserResponse(**user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: RealDictCursor = Depends(get_db)):
    db.execute("SELECT * FROM users WHERE email = %s", (payload.email,))
    user = db.fetchone()

    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user = dict(user)
    token = create_access_token({"sub": str(user["id"]), "role": user["role"]})
    return TokenResponse(access_token=token, user=UserResponse(**user))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)


@router.get("/users", response_model=list[UserResponse])
def get_users(
    role: str = None,
    current_user: dict = Depends(get_current_user),
    db: RealDictCursor = Depends(get_db)
):
    if current_user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    query = "SELECT * FROM users"
    params = ()
    if role:
        query += " WHERE role = %s"
        params = (role,)
        
    db.execute(query, params)
    return [dict(u) for u in db.fetchall()]
