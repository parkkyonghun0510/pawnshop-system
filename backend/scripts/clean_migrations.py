#!/usr/bin/env python3
"""
Script to clean up empty migrations and fix migration history.
This script should be run before implementing Context7.
"""

import os
import re
import sys
from pathlib import Path

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Empty migrations to remove
EMPTY_MIGRATIONS = [
    "41c829aa0b03_.py",
    "7e5807d46fec_add_a_column.py",
    "21e27193f488_add_first_name_and_last_name_to_users_.py"
]

# Duplicate migrations to remove
DUPLICATE_MIGRATIONS = [
    "1edb4ba836b5_add_first_name_and_last_name_to_users_.py",
    "a04322642355_add_first_name_and_last_name_to_users_.py",
    "a26726d1b6fb_add_first_name_and_last_name_to_users_.py"
]

def update_migration_chain(versions_dir, removed_migrations):
    """
    Update the migration chain by fixing down_revision references
    in migration files after removing empty migrations.
    """
    # Build a map of revision IDs to file names
    revision_map = {}
    down_revision_map = {}
    
    # First pass: collect all revision IDs and their down_revisions
    for filename in os.listdir(versions_dir):
        if not filename.endswith('.py') or filename == '__init__.py':
            continue
            
        with open(os.path.join(versions_dir, filename), 'r') as f:
            content = f.read()
            
            # Extract revision ID
            revision_match = re.search(r'revision: str = [\'"]([^\'"]+)[\'"]', content)
            if revision_match:
                revision_id = revision_match.group(1)
                revision_map[revision_id] = filename
                
            # Extract down_revision
            down_revision_match = re.search(r'down_revision: Union\[str, None\] = [\'"]([^\'"]+)[\'"]', content)
            if down_revision_match:
                down_revision = down_revision_match.group(1)
                down_revision_map[revision_id] = down_revision
    
    # Second pass: fix the migration chain
    for filename in os.listdir(versions_dir):
        if not filename.endswith('.py') or filename == '__init__.py' or filename in removed_migrations:
            continue
            
        with open(os.path.join(versions_dir, filename), 'r') as f:
            content = f.read()
            
        # Extract revision ID
        revision_match = re.search(r'revision: str = [\'"]([^\'"]+)[\'"]', content)
        if not revision_match:
            continue
            
        revision_id = revision_match.group(1)
        
        # Extract down_revision
        down_revision_match = re.search(r'down_revision: Union\[str, None\] = [\'"]([^\'"]+)[\'"]', content)
        if not down_revision_match:
            continue
            
        down_revision = down_revision_match.group(1)
        
        # Check if down_revision points to a removed migration
        if down_revision in [re.search(r'([a-z0-9]+)_', m).group(1) for m in removed_migrations if re.search(r'([a-z0-9]+)_', m)]:
            # Find the previous valid migration
            previous_revision = down_revision
            while previous_revision in [re.search(r'([a-z0-9]+)_', m).group(1) for m in removed_migrations if re.search(r'([a-z0-9]+)_', m)]:
                previous_revision = down_revision_map.get(previous_revision)
            
            # Update the down_revision
            new_content = re.sub(
                r'(down_revision: Union\[str, None\] = )[\'"]([^\'"]+)[\'"]',
                f'\\1"{previous_revision}"' if previous_revision else '\\1None',
                content
            )
            
            with open(os.path.join(versions_dir, filename), 'w') as f:
                f.write(new_content)
            
            print(f"Updated down_revision in {filename} from {down_revision} to {previous_revision or 'None'}")

def main():
    """Main function to clean up migrations."""
    # Get the versions directory
    versions_dir = Path(__file__).parent.parent / 'migrations' / 'versions'
    
    if not versions_dir.exists():
        print(f"Error: Versions directory not found at {versions_dir}")
        return
    
    # Collect migrations to remove
    migrations_to_remove = []
    for filename in EMPTY_MIGRATIONS + DUPLICATE_MIGRATIONS:
        file_path = versions_dir / filename
        if file_path.exists():
            migrations_to_remove.append(filename)
    
    if not migrations_to_remove:
        print("No empty or duplicate migrations found to remove.")
        return
    
    # Backup migrations before removing
    backup_dir = versions_dir.parent / 'backup_versions'
    backup_dir.mkdir(exist_ok=True)
    
    for filename in migrations_to_remove:
        src_path = versions_dir / filename
        dst_path = backup_dir / filename
        
        # Copy file to backup
        with open(src_path, 'r') as src, open(dst_path, 'w') as dst:
            dst.write(src.read())
        
        print(f"Backed up {filename} to {backup_dir}")
    
    # Update migration chain before removing files
    update_migration_chain(versions_dir, migrations_to_remove)
    
    # Remove the files
    for filename in migrations_to_remove:
        file_path = versions_dir / filename
        os.remove(file_path)
        print(f"Removed {filename}")
    
    print("\nMigration cleanup complete!")
    print(f"Removed {len(migrations_to_remove)} migration files.")
    print(f"Backups stored in {backup_dir}")
    print("\nNext steps:")
    print("1. Run 'alembic current' to verify the migration chain")
    print("2. Implement Context7 for future migrations")

if __name__ == "__main__":
    main()
