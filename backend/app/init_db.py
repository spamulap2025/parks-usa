"""Initialize database with PostGIS extension and create tables"""
from app.database import init_db
from app.models.park import Park

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Database initialized successfully!")
    print("- PostGIS extension enabled")
    print("- Parks table created with spatial indexes")
