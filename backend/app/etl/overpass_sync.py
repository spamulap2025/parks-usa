"""
Overpass API ETL - Fetch State and Local Parks from OpenStreetMap
Uses tiling strategy to avoid timeouts
"""
import requests
from sqlalchemy.orm import Session
from geoalchemy2 import WKTElement
from datetime import datetime
import time
from typing import List, Tuple

from app.models.park import Park, ParkType, ParkSource
from app.database import SessionLocal

OVERPASS_API_URL = "https://overpass-api.de/api/interpreter"

def generate_tiles() -> List[Tuple[float, float, float, float]]:
    """Generate tiles covering USA including AK, HI, and territories"""
    tiles = []
    
    lat_min, lat_max = 24.5, 49.5
    lon_min, lon_max = -125.0, -66.0
    tile_size = 3.0  # degrees
    
    lat = lat_min
    while lat < lat_max:
        lon = lon_min
        while lon < lon_max:
            tiles.append((lat, lon, min(lat + tile_size, lat_max), min(lon + tile_size, lon_max)))
            lon += tile_size
        lat += tile_size
    
    tiles.append((51.0, -180.0, 72.0, -141.0))
    
    tiles.append((18.0, -161.0, 23.0, -154.0))
    
    tiles.append((17.5, -67.5, 18.8, -65.0))
    
    tiles.append((17.5, -65.5, 18.5, -64.0))
    
    tiles.append((13.0, 144.5, 14.0, 145.5))
    
    tiles.append((-14.5, -171.0, -14.0, -169.0))
    
    return tiles

def fetch_parks_for_tile(bbox: Tuple[float, float, float, float], timeout: int = 180) -> List[dict]:
    """Fetch parks from Overpass API for a given bounding box"""
    lat_min, lon_min, lat_max, lon_max = bbox
    
    query = f"""
    [out:json][timeout:{timeout}];
    (
      node["leisure"="park"]({lat_min},{lon_min},{lat_max},{lon_max});
      way["leisure"="park"]({lat_min},{lon_min},{lat_max},{lon_max});
      relation["leisure"="park"]({lat_min},{lon_min},{lat_max},{lon_max});
      
      node["leisure"="nature_reserve"]({lat_min},{lon_min},{lat_max},{lon_max});
      way["leisure"="nature_reserve"]({lat_min},{lon_min},{lat_max},{lon_max});
      relation["leisure"="nature_reserve"]({lat_min},{lon_min},{lat_max},{lon_max});
      
      node["boundary"="protected_area"]({lat_min},{lon_min},{lat_max},{lon_max});
      way["boundary"="protected_area"]({lat_min},{lon_min},{lat_max},{lon_max});
      relation["boundary"="protected_area"]({lat_min},{lon_min},{lat_max},{lon_max});
    );
    out center;
    """
    
    try:
        response = requests.post(OVERPASS_API_URL, data={"data": query}, timeout=timeout)
        response.raise_for_status()
        data = response.json()
        return data.get("elements", [])
    except requests.exceptions.Timeout:
        print(f"  Timeout for tile {bbox}")
        return []
    except Exception as e:
        print(f"  Error fetching tile {bbox}: {e}")
        return []

def classify_osm_park(tags: dict) -> ParkType:
    """Classify park type based on OSM tags"""
    operator = tags.get("operator", "").lower()
    name = tags.get("name", "").lower()
    designation = tags.get("designation", "").lower()
    
    if "nps" in operator or "national park service" in operator:
        if "national park" in name or "national park" in designation:
            return ParkType.NATIONAL_PARK
        elif "national monument" in name or "national monument" in designation:
            return ParkType.NATIONAL_MONUMENT
    
    state_keywords = ["state park", "state recreation", "state forest", "state reserve", 
                     "dnr", "department of natural resources", "state of"]
    if any(keyword in operator for keyword in state_keywords) or \
       any(keyword in name for keyword in state_keywords) or \
       any(keyword in designation for keyword in state_keywords):
        return ParkType.STATE
    
    return ParkType.LOCAL

def sync_overpass_parks(db: Session, max_tiles: int = None):
    """Sync parks from Overpass API to database"""
    tiles = generate_tiles()
    print(f"Generated {len(tiles)} tiles to process")
    
    if max_tiles:
        tiles = tiles[:max_tiles]
        print(f"Limited to {max_tiles} tiles for testing")
    
    total_synced = 0
    total_skipped = 0
    
    for i, tile in enumerate(tiles):
        print(f"Processing tile {i+1}/{len(tiles)}: {tile}")
        
        elements = fetch_parks_for_tile(tile)
        print(f"  Found {len(elements)} elements")
        
        for element in elements:
            try:
                osm_id = element.get("id")
                osm_type = element.get("type")
                tags = element.get("tags", {})
                
                if not tags.get("name"):
                    total_skipped += 1
                    continue
                
                if "center" in element:
                    lat = element["center"]["lat"]
                    lon = element["center"]["lon"]
                elif "lat" in element and "lon" in element:
                    lat = element["lat"]
                    lon = element["lon"]
                else:
                    total_skipped += 1
                    continue
                
                park_type = classify_osm_park(tags)
                external_id = f"{osm_type}/{osm_id}"
                
                point_wkt = f"POINT({lon} {lat})"
                
                existing_park = db.query(Park).filter(
                    Park.source == ParkSource.OSM,
                    Park.external_id == external_id
                ).first()
                
                if existing_park:
                    existing_park.name = tags.get("name")
                    existing_park.type = park_type
                    existing_park.operator = tags.get("operator")
                    existing_park.centroid = WKTElement(point_wkt, srid=4326)
                    existing_park.raw_tags = tags
                    existing_park.last_seen_at = datetime.utcnow()
                    existing_park.updated_at = datetime.utcnow()
                else:
                    new_park = Park(
                        source=ParkSource.OSM,
                        external_id=external_id,
                        type=park_type,
                        name=tags.get("name"),
                        operator=tags.get("operator"),
                        centroid=WKTElement(point_wkt, srid=4326),
                        raw_tags=tags,
                    )
                    db.add(new_park)
                
                db.commit()
                total_synced += 1
                
            except Exception as e:
                print(f"  Error processing element {element.get('id')}: {e}")
                db.rollback()
                total_skipped += 1
                continue
        
        time.sleep(2)
    
    print(f"Synced {total_synced} OSM parks ({total_skipped} skipped)")
    return total_synced

if __name__ == "__main__":
    import sys
    max_tiles = int(sys.argv[1]) if len(sys.argv) > 1 else None
    
    db = SessionLocal()
    try:
        sync_overpass_parks(db, max_tiles)
    finally:
        db.close()
