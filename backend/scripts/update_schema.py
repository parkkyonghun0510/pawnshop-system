#!/usr/bin/env python3
"""
Script to update the database schema using Context7.
This script creates a new migration for any schema changes.
"""

import os
import sys
from pathlib import Path
import argparse

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.context7 import Context7, MigrationType

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Update the database schema using Context7")
    parser.add_argument(
        "--name",
        type=str,
        default="schema_update",
        help="Name of the migration (default: schema_update)"
    )
    parser.add_argument(
        "--type",
        type=str,
        choices=[t.value for t in MigrationType],
        default=MigrationType.SCHEMA.value,
        help=f"Type of migration (default: {MigrationType.SCHEMA.value})"
    )
    parser.add_argument(
        "--message",
        type=str,
        help="Optional message to include in the migration"
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply the migration after creating it"
    )
    return parser.parse_args()

def main():
    """Update the database schema using Context7."""
    args = parse_args()
    
    # Check if we're in the correct directory
    if not (Path.cwd() / "alembic.ini").exists():
        print("Error: alembic.ini not found in the current directory.")
        print("Please run this script from the backend directory.")
        return
    
    # Create a new migration
    Context7.create_migration(
        name=args.name,
        migration_type=args.type,
        message=args.message
    )
    
    # Apply the migration if requested
    if args.apply:
        print("\nApplying migration...")
        Context7.upgrade()
    
    print("\nSchema update complete!")
    print("\nNext steps:")
    if not args.apply:
        print("1. Review the generated migration file")
        print("2. Run 'alembic upgrade head' to apply the migration")
    else:
        print("1. Verify the migration was applied successfully with 'alembic current'")

if __name__ == "__main__":
    main()
