#!/usr/bin/env python3
"""
Script to create a migration for enhancing the loan application workflow.
This script uses Context7 to create a schema migration.
"""

import os
import sys
from pathlib import Path

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.context7 import Context7

def main():
    """Create a migration for enhancing the loan application workflow."""
    print("Creating migration for enhancing the loan application workflow...")
    
    # Check if we're in the correct directory
    if not (Path.cwd() / "alembic.ini").exists():
        print("Error: alembic.ini not found in the current directory.")
        print("Please run this script from the backend directory.")
        return
    
    # Create a new schema migration
    Context7.create_migration(
        name="enhance_loan_application_workflow",
        migration_type="schema",
        message="Add fields to Application model for improved loan workflow"
    )
    
    print("\nMigration created successfully!")
    print("\nNext steps:")
    print("1. Edit the generated migration file to add the necessary fields")
    print("2. Run 'alembic upgrade head' to apply the migration")

if __name__ == "__main__":
    main()
