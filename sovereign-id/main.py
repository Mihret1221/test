import datetime

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

app = FastAPI(title="SovereignID IAM Engine", version="1.0.0")
security = HTTPBearer()
SECRET_KEY = "super-secret-un-key-change-this-in-production"
ALGORITHM = "HS256"
TOKEN_EXPIRATION_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
MOCK_ROLES_DB = {
    "Field_Worker": {"clearance_level": 1},
    "HQ_Admin": {"clearance_level": 3},
}


# --- DATA SCHEMAS & HELPERS ---
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str


class UserLogin(BaseModel):
    username: str
    password: str


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


MOCK_USER_DB = {
    "field_worker": {
        "username": "field_worker",
        "email": "field_worker@example.com",
        "password_hash": hash_password("user123"),
        "role": "Field_Worker",
        "clearance": MOCK_ROLES_DB["Field_Worker"]["clearance_level"],
    },
    "hq_admin": {
        "username": "hq_admin",
        "email": "admin@example.com",
        "password_hash": hash_password("admin123"),
        "role": "HQ_Admin",
        "clearance": MOCK_ROLES_DB["HQ_Admin"]["clearance_level"],
    },
}


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=TOKEN_EXPIRATION_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# --- GATEKEEPER MIDDLEWARE & ENDPOINTS ---
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token invalid or expired.")


@app.post("/auth/register", status_code=201)
def register_identity(user: UserRegister):
    if user.username in MOCK_USER_DB:
        raise HTTPException(status_code=400, detail="Username exists.")
    if user.role not in MOCK_ROLES_DB:
        raise HTTPException(status_code=400, detail="Invalid enterprise role.")

    MOCK_USER_DB[user.username] = {
        "username": user.username,
        "email": user.email,
        "password_hash": hash_password(user.password),
        "role": user.role,
        "clearance": MOCK_ROLES_DB[user.role]["clearance_level"],
    }
    return {"status": "success"}


@app.post("/auth/login")
def login_and_get_token(user: UserLogin):
    db_user = MOCK_USER_DB.get(user.username)
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    token = create_access_token(
        {
            "sub": db_user["username"],
            "role": db_user["role"],
            "clearance": db_user["clearance"],
        }
    )
    return {"access_token": token, "token_type": "bearer"}


@app.get("/field/supplies")
def read_field_logistics(current_user: dict = Depends(get_current_user)):
    return {"user": current_user["sub"], "supplies": ["Rations", "Water Filters"]}


@app.get("/admin/diplomatic-logs")
def read_high_clearance_audit(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "HQ_Admin" or current_user.get("clearance") < 3:
        raise HTTPException(status_code=403, detail="Insufficient clearance.")
    return {"status": "CONFIRMED", "logs": ["Internal gateways secured"]}
