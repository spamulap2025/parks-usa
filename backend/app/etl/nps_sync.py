"""
NPS API ETL - Fetch National Parks and National Monuments from NPS API
"""
import requests
from sqlalchemy.orm import Session
from geoalchemy2 import WKTElement
from datetime import datetime
import time

from app.models.park import Park, ParkType, ParkSource
from app.database import SessionLocal

NPS_API_BASE = "https://developer.nps.gov/api/v1"

def fetch_nps_parks(api_key: str, limit: int = 500):
    """Fetch all parks from NPS API"""
    parks = []
    start = 0
    
    while True:
        url = f"{NPS_API_BASE}/parks"
        params = {
            "api_key": api_key,
            "limit": limit,
            "start": start,
        }
        
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            batch = data.get("data", [])
            if not batch:
                break
            
            parks.extend(batch)
            
            total = data.get("total", 0)
            if len(parks) >= total:
                break
            
            start += limit
            time.sleep(0.5)  # Rate limiting
            
        except Exception as e:
            print(f"Error fetching NPS parks: {e}")
            break
    
    return parks

def classify_park_type(designation: str) -> ParkType:
    """Classify park type based on NPS designation"""
    designation_lower = designation.lower()
    
    if "national park" in designation_lower and "preserve" not in designation_lower:
        return ParkType.NATIONAL_PARK
    elif "national monument" in designation_lower:
        return ParkType.NATIONAL_MONUMENT
    else:
        return None

def sync_nps_parks(db: Session, api_key: str):
    """Sync NPS parks to database"""
    print("Fetching parks from NPS API...")
    nps_parks = fetch_nps_parks(api_key)
    print(f"Fetched {len(nps_parks)} parks from NPS API")
    
    synced_count = 0
    skipped_count = 0
    
    for park_data in nps_parks:
        try:
            park_code = park_data.get("parkCode")
            name = park_data.get("fullName") or park_data.get("name")
            designation = park_data.get("designation", "")
            
            park_type = classify_park_type(designation)
            if not park_type:
                skipped_count += 1
                continue
            
            latitude = park_data.get("latitude")
            longitude = park_data.get("longitude")
            
            if not latitude or not longitude:
                skipped_count += 1
                continue
            
            try:
                lat = float(latitude)
                lon = float(longitude)
            except (ValueError, TypeError):
                skipped_count += 1
                continue
            
            states = park_data.get("states", "")
            state_code = states.split(",")[0].strip() if states else None
            
            point_wkt = f"POINT({lon} {lat})"
            
            existing_park = db.query(Park).filter(
                Park.source == ParkSource.NPS,
                Park.external_id == park_code
            ).first()
            
            if existing_park:
                existing_park.name = name
                existing_park.type = park_type
                existing_park.state_code = state_code
                existing_park.centroid = WKTElement(point_wkt, srid=4326)
                existing_park.description = park_data.get("description")
                existing_park.url = park_data.get("url")
                existing_park.raw_tags = park_data
                existing_park.last_seen_at = datetime.utcnow()
                existing_park.updated_at = datetime.utcnow()
            else:
                new_park = Park(
                    source=ParkSource.NPS,
                    external_id=park_code,
                    type=park_type,
                    name=name,
                    state_code=state_code,
                    centroid=WKTElement(point_wkt, srid=4326),
                    description=park_data.get("description"),
                    url=park_data.get("url"),
                    raw_tags=park_data,
                )
                db.add(new_park)
            
            db.commit()
            synced_count += 1
            
        except Exception as e:
            print(f"Error processing park {park_data.get('parkCode')}: {e}")
            db.rollback()
            skipped_count += 1
            continue
    
    print(f"Synced {synced_count} NPS parks ({skipped_count} skipped)")
    return synced_count

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python -m app.etl.nps_sync <NPS_API_KEY>")
        sys.exit(1)
    
    api_key = sys.argv[1]
    db = SessionLocal()
    try:
        sync_nps_parks(db, api_key)
    finally:
        db.close()
