from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import text
import bcrypt
import uuid
from typing import Dict, List, Optional

from app.database import get_db
from app.models.park import Park, ParkType, ParkSource

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
    user_id = str(uuid.uuid4())
    
    return {
        "message": "Login successful",
        "user": {
            "user_id": user_id,
            "username": credentials.username,
            "email": f"{credentials.username}@example.com"
        }
    }

class ParkResponse(BaseModel):
    id: str
    source: str
    external_id: str
    type: str
    name: str
    operator: Optional[str]
    state_code: Optional[str]
    latitude: float
    longitude: float
    description: Optional[str]
    url: Optional[str]

@app.get("/parks", response_model=List[ParkResponse])
async def get_parks(
    bbox: str = Query(..., description="Bounding box: minLng,minLat,maxLng,maxLat"),
    types: Optional[str] = Query(None, description="Comma-separated park types: local,state,national_park,national_monument"),
    limit: int = Query(1000, le=5000),
    db: Session = Depends(get_db)
):
    """Get parks within a bounding box"""
    try:
        bbox_parts = bbox.split(",")
        if len(bbox_parts) != 4:
            raise HTTPException(status_code=400, detail="Invalid bbox format. Expected: minLng,minLat,maxLng,maxLat")
        
        min_lng, min_lat, max_lng, max_lat = map(float, bbox_parts)
        
        type_filter = []
        if types:
            type_names = types.split(",")
            for type_name in type_names:
                type_name = type_name.strip()
                if type_name == "local":
                    type_filter.append(ParkType.LOCAL)
                elif type_name == "state":
                    type_filter.append(ParkType.STATE)
                elif type_name == "national_park":
                    type_filter.append(ParkType.NATIONAL_PARK)
                elif type_name == "national_monument":
                    type_filter.append(ParkType.NATIONAL_MONUMENT)
        
        query = db.query(Park)
        
        if type_filter:
            query = query.filter(Park.type.in_(type_filter))
        
        bbox_wkt = f"POLYGON(({min_lng} {min_lat},{max_lng} {min_lat},{max_lng} {max_lat},{min_lng} {max_lat},{min_lng} {min_lat}))"
        query = query.filter(
            text(f"ST_Intersects(centroid, ST_GeogFromText('SRID=4326;{bbox_wkt}'))")
        )
        
        query = query.limit(limit)
        
        parks = query.all()
        
        result = []
        for park in parks:
            centroid_result = db.execute(
                text("SELECT ST_Y(centroid::geometry) as lat, ST_X(centroid::geometry) as lon FROM parks WHERE id = :park_id"),
                {"park_id": park.id}
            ).fetchone()
            
            result.append(ParkResponse(
                id=str(park.id),
                source=park.source.value,
                external_id=park.external_id,
                type=park.type.value,
                name=park.name,
                operator=park.operator,
                state_code=park.state_code,
                latitude=centroid_result[0] if centroid_result else 0.0,
                longitude=centroid_result[1] if centroid_result else 0.0,
                description=park.description,
                url=park.url
            ))
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid bbox values: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching parks: {str(e)}")

@app.post("/etl/sync")
async def trigger_etl_sync(db: Session = Depends(get_db)):
    """Trigger ETL sync for all parks (NPS + Overpass)"""
    from app.etl.nps_sync import sync_nps_parks
    from app.etl.overpass_sync import sync_overpass_parks
    import os
    
    try:
        nps_api_key = os.getenv("NPS_API_KEY")
        if not nps_api_key:
            raise HTTPException(status_code=500, detail="NPS_API_KEY not configured")
        
        nps_count = sync_nps_parks(db, nps_api_key)
        
        osm_count = sync_overpass_parks(db, max_tiles=10)
        
        return {
            "message": "ETL sync completed",
            "nps_parks": nps_count,
            "osm_parks": osm_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ETL sync failed: {str(e)}")
