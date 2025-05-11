"""
Context7 - A structured approach to database migrations with Alembic.

This module provides a structured workflow for managing database migrations
using Alembic in a FastAPI application. It follows a 7-context approach:

1. Schema - Database schema changes (tables, columns, constraints)
2. Data - Data migrations and transformations
3. Indexes - Index creation and optimization
4. Functions - Database functions and stored procedures
5. Views - Database views
6. Triggers - Database triggers
7. Permissions - Database permissions and grants

Usage:
    from app.db.context7 import Context7

    # Create a new migration
    Context7.create_migration("add_user_table", "schema")

    # Run migrations
    Context7.upgrade()

    # Downgrade migrations
    Context7.downgrade()
"""

import os
import subprocess
import sys
from enum import Enum
from pathlib import Path
from typing import List, Optional, Union


class MigrationType(str, Enum):
    """Types of migrations in Context7."""
    SCHEMA = "schema"
    DATA = "data"
    INDEX = "index"
    FUNCTION = "function"
    VIEW = "view"
    TRIGGER = "trigger"
    PERMISSION = "permission"


class Context7:
    """Context7 migration manager."""

    @staticmethod
    def create_migration(
        name: str,
        migration_type: Union[str, MigrationType],
        message: Optional[str] = None
    ) -> None:
        """
        Create a new migration with the specified type prefix.

        Args:
            name: The name of the migration
            migration_type: The type of migration (schema, data, etc.)
            message: Optional message to include in the migration
        """
        # Validate migration type
        if isinstance(migration_type, str):
            try:
                migration_type = MigrationType(migration_type.lower())
            except ValueError:
                valid_types = ", ".join([t.value for t in MigrationType])
                raise ValueError(
                    f"Invalid migration type: {migration_type}. "
                    f"Valid types are: {valid_types}"
                )

        # Format the migration name with the type prefix
        prefixed_name = f"{migration_type.value}_{name}"
        
        # Build the alembic command
        cmd = ["alembic", "revision", "--autogenerate", "-m", prefixed_name]
        
        # Add message if provided
        if message:
            cmd.extend(["--message", message])
        
        # Run the command
        try:
            subprocess.run(cmd, check=True)
            print(f"Created new {migration_type.value} migration: {prefixed_name}")
        except subprocess.CalledProcessError as e:
            print(f"Error creating migration: {e}")
            sys.exit(1)

    @staticmethod
    def upgrade(revision: str = "head") -> None:
        """
        Upgrade the database to the specified revision.

        Args:
            revision: The revision to upgrade to (default: "head")
        """
        cmd = ["alembic", "upgrade", revision]
        try:
            subprocess.run(cmd, check=True)
            print(f"Upgraded database to {revision}")
        except subprocess.CalledProcessError as e:
            print(f"Error upgrading database: {e}")
            sys.exit(1)

    @staticmethod
    def downgrade(revision: str = "-1") -> None:
        """
        Downgrade the database to the specified revision.

        Args:
            revision: The revision to downgrade to (default: "-1")
        """
        cmd = ["alembic", "downgrade", revision]
        try:
            subprocess.run(cmd, check=True)
            print(f"Downgraded database to {revision}")
        except subprocess.CalledProcessError as e:
            print(f"Error downgrading database: {e}")
            sys.exit(1)

    @staticmethod
    def current() -> None:
        """Show the current revision of the database."""
        cmd = ["alembic", "current"]
        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error getting current revision: {e}")
            sys.exit(1)

    @staticmethod
    def history() -> None:
        """Show the migration history."""
        cmd = ["alembic", "history"]
        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error getting migration history: {e}")
            sys.exit(1)

    @staticmethod
    def get_migrations_by_type(migration_type: Union[str, MigrationType]) -> List[str]:
        """
        Get all migrations of a specific type.

        Args:
            migration_type: The type of migration to filter by

        Returns:
            A list of migration revision IDs of the specified type
        """
        # Validate migration type
        if isinstance(migration_type, str):
            try:
                migration_type = MigrationType(migration_type.lower())
            except ValueError:
                valid_types = ", ".join([t.value for t in MigrationType])
                raise ValueError(
                    f"Invalid migration type: {migration_type}. "
                    f"Valid types are: {valid_types}"
                )

        # Get the versions directory
        versions_dir = Path(os.getcwd()) / "migrations" / "versions"
        
        # Find migrations of the specified type
        migrations = []
        for file_path in versions_dir.glob("*.py"):
            if file_path.name.startswith(f"{migration_type.value}_"):
                migrations.append(file_path.stem.split("_")[0])
        
        return migrations
