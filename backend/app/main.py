from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import bcrypt
import uuid
from typing import Dict

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

users_db: Dict[str, dict] = {}
username_index: Dict[str, str] = {}
email_index: Dict[str, str] = {}

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    user_id: str
    username: str
    email: str

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/register")
async def register(user: UserRegister):
    if user.username in username_index:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    if user.email in email_index:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    user_id = str(uuid.uuid4())
    password_bytes = user.password.encode('utf-8')
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password_bytes, salt)
    
    user_data = {
        "user_id": user_id,
        "username": user.username,
        "email": user.email,
        "password_hash": password_hash
    }
    
    users_db[user_id] = user_data
    username_index[user.username] = user_id
    email_index[user.email] = user_id
    
    return {
        "message": "User registered successfully",
        "user_id": user_id
    }

@app.post("/login")
async def login(credentials: UserLogin):
    if credentials.username not in username_index:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = username_index[credentials.username]
    user_data = users_db[user_id]
    
    password_bytes = credentials.password.encode('utf-8')
    if not bcrypt.checkpw(password_bytes, user_data["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "message": "Login successful",
        "user": {
            "user_id": user_data["user_id"],
            "username": user_data["username"],
            "email": user_data["email"]
        }
    }
