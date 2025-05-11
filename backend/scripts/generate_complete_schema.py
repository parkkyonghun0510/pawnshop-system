#!/usr/bin/env python3
"""
Script to generate a complete database schema migration using Context7.
This script should be run after cleaning up the migrations.
"""

import os
import sys
from pathlib import Path

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.context7 import Context7

def main():
    """Generate a complete database schema migration."""
    print("Generating complete database schema migration...")
    
    # Check if we're in the correct directory
    if not (Path.cwd() / "alembic.ini").exists():
        print("Error: alembic.ini not found in the current directory.")
        print("Please run this script from the backend directory.")
        return
    
    # Create a new schema migration
    Context7.create_migration(
        name="complete_schema",
        migration_type="schema",
        message="Complete database schema including all models"
    )
    
    print("\nMigration created successfully!")
    print("\nNext steps:")
    print("1. Review the generated migration file")
    print("2. Run 'alembic upgrade head' to apply the migration")
    print("3. Use Context7 for future migrations")

if __name__ == "__main__":
    main()
