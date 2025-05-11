#!/bin/bash
# Run all the database schema finalization steps

# Change to the backend directory
cd "$(dirname "$0")/.." || exit

# Make all scripts executable
bash scripts/make_scripts_executable.sh

# Step 1: Clean up migrations
echo "Step 1: Cleaning up migrations..."
python scripts/clean_migrations.py

# Step 2: Check schema completeness
echo "Step 2: Checking schema completeness..."
python scripts/check_schema_completeness.py

# Step 3: Generate complete schema
echo "Step 3: Generating complete schema..."
python scripts/generate_complete_schema.py

# Step 4: Initialize database
echo "Step 4: Initializing database..."
python scripts/init_db.py --seed

echo "Database schema finalization complete!"
echo "Next steps:"
echo "1. Review the generated migration files"
echo "2. Use Context7 for future migrations"
