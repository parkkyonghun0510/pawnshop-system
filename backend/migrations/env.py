from logging.config import fileConfig
import os
import sys
import logging
from dotenv import load_dotenv

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Set up logger
logger = logging.getLogger("alembic.env")

# Load environment variables from .env file
load_dotenv()

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Get the database URL from environment variable
db_url = os.getenv('DATABASE_URL')

# Check if DATABASE_URL is set
if not db_url:
    logger.error("DATABASE_URL environment variable not set!")
    raise ValueError("DATABASE_URL environment variable not set. Please set it in your .env file.")

# Handle case where the value might include 'DATABASE_URL=' prefix
if db_url.startswith('DATABASE_URL='):
    db_url = db_url.split('=', 1)[1]

# Set the database URL in Alembic config
config.set_main_option('sqlalchemy.url', db_url)

# Add the app directory to the Python path so we can import modules
base_path = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, base_path)

# Import Base from database module
from app.database import Base

# Import all models so Alembic can detect them
from app.models.users import User, Role, Permission, AuditLog
from app.models.organization import Branch, Employee, EmployeeType
from app.models.operations import (
    Customer, 
    Item, 
    ItemStatus, 
    ItemCategory, 
    Loan, 
    Payment, 
    Transaction, 
    TransactionType
)

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# Define a name filter function for Alembic
def include_name(name, type_, parent_names):
    # You can customize this function to filter specific tables or columns
    # For now, include everything
    return True


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    logger.info(f"Running migrations offline with URL template: {url}")
    
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # Add these options to support autogenerate in offline mode
        compare_type=True,
        render_as_batch=True,
        include_schemas=True,
        include_name=include_name,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    logger.info("Running migrations online")
    
    # Override with environment variables if available
    section = config.get_section(config.config_ini_section, {})
    
    connectable = engine_from_config(
        section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata,
            # Add these options to handle enum types
            compare_type=True,
            render_as_batch=True,
            include_schemas=True,
            include_name=include_name,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
