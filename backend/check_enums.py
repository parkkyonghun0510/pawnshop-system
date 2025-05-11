#!/usr/bin/env python3
"""
Script to check PostgreSQL enum types in the database.
"""

import sys
from pathlib import Path

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from app.db.session import engine
from sqlalchemy import inspect

def main():
    """Check PostgreSQL enum types in the database."""
    inspector = inspect(engine)
    
    print("PostgreSQL Enum Types:")
    for enum in inspector.get_enums():
        print(f"- Name: {enum['name']}")
        print(f"  Values: {enum['enums']}")
        print()

if __name__ == "__main__":
    main()
