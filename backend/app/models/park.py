from sqlalchemy import Column, String, Float, DateTime, Enum, Index, JSON
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geography
import uuid
from datetime import datetime
import enum

from app.database import Base

class ParkType(str, enum.Enum):
    LOCAL = "local"
    STATE = "state"
    NATIONAL_PARK = "national_park"
    NATIONAL_MONUMENT = "national_monument"

class ParkSource(str, enum.Enum):
    NPS = "nps"
    OSM = "osm"

class Park(Base):
    __tablename__ = "parks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = Column(Enum(ParkSource), nullable=False)
    external_id = Column(String, nullable=False)
    type = Column(Enum(ParkType), nullable=False, index=True)
    name = Column(String, nullable=False)
    operator = Column(String, nullable=True)
    state_code = Column(String(2), nullable=True, index=True)
    
    centroid = Column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    
    geom = Column(Geography(geometry_type='GEOMETRY', srid=4326), nullable=True)
    
    raw_tags = Column(JSON, nullable=True)
    description = Column(String, nullable=True)
    url = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_seen_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        Index('idx_parks_centroid', 'centroid', postgresql_using='gist'),
        Index('idx_parks_source_external_id', 'source', 'external_id', unique=True),
    )
    
    def to_dict(self):
        """Convert park to dictionary for API responses"""
        from geoalchemy2.shape import to_shape
        from shapely.geometry import Point
        
        point = to_shape(self.centroid)
        
        return {
            "id": str(self.id),
            "name": self.name,
            "type": self.type.value,
            "state": self.state_code,
            "latitude": point.y,
            "longitude": point.x,
            "operator": self.operator,
            "description": self.description,
            "url": self.url,
        }
