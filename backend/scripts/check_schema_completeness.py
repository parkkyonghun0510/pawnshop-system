#!/usr/bin/env python3
"""
Script to check for missing tables or relationships in the database schema.
This script analyzes the SQLAlchemy models and compares them with the database.
"""

import os
import sys
from pathlib import Path
import importlib
import inspect
from sqlalchemy import inspect as sa_inspect
from sqlalchemy.ext.declarative import DeclarativeMeta

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import Base, engine
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
    TransactionType,
    Application,
    ApplicationStatus
)

def get_all_models():
    """Get all SQLAlchemy models defined in the application."""
    models = []
    
    # Import all modules that might contain models
    model_modules = [
        'app.models.users',
        'app.models.organization',
        'app.models.operations'
    ]
    
    for module_name in model_modules:
        module = importlib.import_module(module_name)
        for name, obj in inspect.getmembers(module):
            if isinstance(obj, type) and issubclass(obj, Base) and obj != Base:
                models.append(obj)
    
    return models

def get_database_tables():
    """Get all tables in the database."""
    inspector = sa_inspect(engine)
    return inspector.get_table_names()

def check_missing_tables(models, db_tables):
    """Check for models that don't have corresponding tables in the database."""
    missing_tables = []
    
    for model in models:
        if hasattr(model, '__tablename__') and model.__tablename__ not in db_tables:
            missing_tables.append(model.__tablename__)
    
    return missing_tables

def check_missing_columns(models, db_tables):
    """Check for model columns that don't exist in the database tables."""
    missing_columns = {}
    inspector = sa_inspect(engine)
    
    for model in models:
        if not hasattr(model, '__tablename__'):
            continue
            
        table_name = model.__tablename__
        if table_name not in db_tables:
            continue
            
        db_columns = {col['name'] for col in inspector.get_columns(table_name)}
        model_columns = {column.key for column in model.__table__.columns}
        
        missing = model_columns - db_columns
        if missing:
            missing_columns[table_name] = list(missing)
    
    return missing_columns

def check_missing_relationships(models):
    """Check for potential issues with model relationships."""
    relationship_issues = []
    
    for model in models:
        if not hasattr(model, '__tablename__'):
            continue
            
        for relationship_name, relationship in inspect.getmembers(model):
            if hasattr(relationship, 'prop') and hasattr(relationship.prop, 'target'):
                target = relationship.prop.target
                if isinstance(target, DeclarativeMeta) and not hasattr(target, '__table__'):
                    relationship_issues.append(f"{model.__name__}.{relationship_name} -> {target.__name__}")
    
    return relationship_issues

def main():
    """Check for missing tables or relationships in the database schema."""
    print("Checking database schema completeness...")
    
    # Get all models and database tables
    models = get_all_models()
    db_tables = get_database_tables()
    
    # Check for missing tables
    missing_tables = check_missing_tables(models, db_tables)
    if missing_tables:
        print("\nMissing tables in database:")
        for table in missing_tables:
            print(f"  - {table}")
    else:
        print("\nAll model tables exist in the database.")
    
    # Check for missing columns
    missing_columns = check_missing_columns(models, db_tables)
    if missing_columns:
        print("\nMissing columns in database tables:")
        for table, columns in missing_columns.items():
            print(f"  - {table}: {', '.join(columns)}")
    else:
        print("\nAll model columns exist in the database tables.")
    
    # Check for relationship issues
    relationship_issues = check_missing_relationships(models)
    if relationship_issues:
        print("\nPotential relationship issues:")
        for issue in relationship_issues:
            print(f"  - {issue}")
    else:
        print("\nNo relationship issues detected.")
    
    # Summary
    if not missing_tables and not missing_columns and not relationship_issues:
        print("\nDatabase schema is complete and matches the models!")
    else:
        print("\nDatabase schema needs to be updated to match the models.")
        print("Run the migration scripts to update the database schema.")

if __name__ == "__main__":
    main()
