"""Initial schema creation

Revision ID: 037586bae455
Revises: 
Create Date: 2025-03-04 13:20:51.535768

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = '037586bae455'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum types using raw SQL
    connection = op.get_bind()
    
    # Drop existing enum types if they exist
    connection.execute(text("DROP TYPE IF EXISTS itemstatus CASCADE"))
    connection.execute(text("DROP TYPE IF EXISTS transactiontype CASCADE"))
    
    # Create enum types
    connection.execute(text("CREATE TYPE itemstatus AS ENUM ('AVAILABLE', 'PAWNED', 'SOLD', 'EXPIRED')"))
    connection.execute(text("CREATE TYPE transactiontype AS ENUM ('LOAN', 'PAYMENT', 'RENEWAL', 'REDEMPTION', 'SALE')"))
    
    # Create tables using raw SQL
    connection.execute(text("""
        CREATE TABLE roles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            description VARCHAR(255),
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """))
    
    connection.execute(text("""
        CREATE TABLE permissions (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            description VARCHAR(255),
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """))
    
    connection.execute(text("""
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role_id INTEGER NOT NULL REFERENCES roles(id),
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """))
    
    connection.execute(text("""
        CREATE TABLE role_permissions (
            role_id INTEGER NOT NULL REFERENCES roles(id),
            permission_id INTEGER NOT NULL REFERENCES permissions(id),
            PRIMARY KEY (role_id, permission_id)
        )
    """))
    
    connection.execute(text("""
        CREATE TABLE audit_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            action VARCHAR(50) NOT NULL,
            details TEXT,
            ip_address VARCHAR(45),
            created_at TIMESTAMP NOT NULL
        )
    """))
    
    connection.execute(text("""
        CREATE TABLE branches (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            address VARCHAR(255),
            phone VARCHAR(20),
            email VARCHAR(100),
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """))
    
    connection.execute(text("""
        CREATE TABLE employee_types (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            description VARCHAR(255),
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """))
    
    connection.execute(text("""
        CREATE TABLE employees (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            branch_id INTEGER NOT NULL REFERENCES branches(id),
            employee_type_id INTEGER NOT NULL REFERENCES employee_types(id),
            hire_date DATE NOT NULL,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """))
    
    connection.execute(text("""
        CREATE TABLE customers (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            email VARCHAR(100),
            phone VARCHAR(20),
            address VARCHAR(255),
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """))
    
    connection.execute(text("""
        CREATE TABLE item_categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            description VARCHAR(255),
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """))
    
    connection.execute(text("""
        CREATE TABLE items (
            id SERIAL PRIMARY KEY,
            category_id INTEGER NOT NULL REFERENCES item_categories(id),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            status itemstatus NOT NULL,
            appraisal_value NUMERIC(10,2) NOT NULL,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """))
    
    connection.execute(text("""
        CREATE TABLE loans (
            id SERIAL PRIMARY KEY,
            customer_id INTEGER NOT NULL REFERENCES customers(id),
            item_id INTEGER NOT NULL REFERENCES items(id),
            amount NUMERIC(10,2) NOT NULL,
            interest_rate NUMERIC(5,2) NOT NULL,
            term_days INTEGER NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            status VARCHAR(20) NOT NULL,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """))
    
    connection.execute(text("""
        CREATE TABLE transactions (
            id SERIAL PRIMARY KEY,
            loan_id INTEGER NOT NULL REFERENCES loans(id),
            type transactiontype NOT NULL,
            amount NUMERIC(10,2) NOT NULL,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """))
    
    connection.execute(text("""
        CREATE TABLE payments (
            id SERIAL PRIMARY KEY,
            loan_id INTEGER NOT NULL REFERENCES loans(id),
            transaction_id INTEGER NOT NULL REFERENCES transactions(id),
            amount NUMERIC(10,2) NOT NULL,
            payment_date DATE NOT NULL,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """))


def downgrade() -> None:
    # Drop tables in reverse order to handle foreign key constraints
    connection = op.get_bind()
    
    connection.execute(text("DROP TABLE IF EXISTS payments CASCADE"))
    connection.execute(text("DROP TABLE IF EXISTS transactions CASCADE"))
    connection.execute(text("DROP TABLE IF EXISTS loans CASCADE"))
    connection.execute(text("DROP TABLE IF EXISTS items CASCADE"))
    connection.execute(text("DROP TABLE IF EXISTS item_categories CASCADE"))
    connection.execute(text("DROP TABLE IF EXISTS customers CASCADE"))
    connection.execute(text("DROP TABLE IF EXISTS employees CASCADE"))
    connection.execute(text("DROP TABLE IF EXISTS employee_types CASCADE"))
    connection.execute(text("DROP TABLE IF EXISTS branches CASCADE"))
    connection.execute(text("DROP TABLE IF EXISTS audit_logs CASCADE"))
    connection.execute(text("DROP TABLE IF EXISTS role_permissions CASCADE"))
    connection.execute(text("DROP TABLE IF EXISTS users CASCADE"))
    connection.execute(text("DROP TABLE IF EXISTS permissions CASCADE"))
    connection.execute(text("DROP TABLE IF EXISTS roles CASCADE"))
    
    # Drop enum types
    connection.execute(text("DROP TYPE IF EXISTS transactiontype CASCADE"))
    connection.execute(text("DROP TYPE IF EXISTS itemstatus CASCADE"))
