#!/usr/bin/env python3
"""
Script to initialize the database with Context7.
This script creates a fresh database schema and seeds initial data.
"""

import os
import sys
from pathlib import Path
import argparse

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.context7 import Context7

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Initialize the database with Context7")
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Drop all tables and recreate the schema"
    )
    parser.add_argument(
        "--seed",
        action="store_true",
        help="Seed the database with initial data"
    )
    return parser.parse_args()

def clean_database():
    """Drop all tables and recreate the schema."""
    print("Dropping all tables...")
    
    # Downgrade to base (remove all migrations)
    Context7.downgrade("base")
    
    print("Database cleaned successfully!")

def create_schema():
    """Create the database schema."""
    print("Creating database schema...")
    
    # Upgrade to head (apply all migrations)
    Context7.upgrade("head")
    
    print("Database schema created successfully!")

def seed_database():
    """Seed the database with initial data."""
    print("Seeding database with initial data...")
    
    # Import and run the seed script
    from app.seed import seed_data
    seed_data()
    
    print("Database seeded successfully!")

def main():
    """Initialize the database with Context7."""
    args = parse_args()
    
    # Check if we're in the correct directory
    if not (Path.cwd() / "alembic.ini").exists():
        print("Error: alembic.ini not found in the current directory.")
        print("Please run this script from the backend directory.")
        return
    
    # Clean the database if requested
    if args.clean:
        clean_database()
    
    # Create the schema
    create_schema()
    
    # Seed the database if requested
    if args.seed:
        seed_database()
    
    print("\nDatabase initialization complete!")
    print("\nNext steps:")
    print("1. Run 'alembic current' to verify the migration state")
    print("2. Use Context7 for future migrations")

if __name__ == "__main__":
    main()
