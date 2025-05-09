#!/usr/bin/env python3
"""
Script to create a test user with a known password.
"""

import os
import sys
import psycopg2
from datetime import datetime
from passlib.context import CryptContext

# Setup password hashing context
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__default_rounds=12
)

def connect_to_db():
    """Connect to the PostgreSQL database"""
    conn = psycopg2.connect(
        os.getenv("DATABASE_URL", "postgresql://postgres:123456@localhost/pawnshop")
    )
    conn.autocommit = False
    return conn

def create_test_user(conn, username, email, password):
    """Create a test user with a known password"""
    cursor = conn.cursor()

    # Hash the password
    password_hash = pwd_context.hash(password)

    # Create user data
    user = {
        "username": username,
        "email": email,
        "password_hash": password_hash,
        "first_name": "Test",
        "last_name": "User",
        "is_active": True,
        "is_superuser": True,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

    # Check if user already exists
    cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (username, email))
    existing_user = cursor.fetchone()

    if existing_user:
        # Update existing user
        user_id = existing_user[0]
        cursor.execute("""
        UPDATE users
        SET password_hash = %s, updated_at = %s
        WHERE id = %s
        """, (password_hash, datetime.now(), user_id))
        print(f"Updated existing user {username} with new password")
    else:
        # Insert new user
        query = """
        INSERT INTO users (username, email, password_hash, first_name, last_name, is_active, is_superuser, created_at, updated_at)
        VALUES (%(username)s, %(email)s, %(password_hash)s, %(first_name)s, %(last_name)s, %(is_active)s, %(is_superuser)s, %(created_at)s, %(updated_at)s)
        RETURNING id;
        """
        cursor.execute(query, user)
        user_id = cursor.fetchone()[0]
        print(f"Created new user {username} with ID {user_id}")

    conn.commit()
    cursor.close()

    return password_hash

def main():
    """Main function"""
    # Default values
    username = "testuser"
    email = "testuser@example.com"
    password = "password123"

    # Connect to database
    try:
        conn = connect_to_db()

        # Create test user
        password_hash = create_test_user(conn, username, email, password)

        print(f"\nTest user created successfully:")
        print(f"Username: {username}")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print(f"Password Hash: {password_hash}")

        # Also update autumn.henry's password
        cursor = conn.cursor()
        autumn_password_hash = pwd_context.hash(password)
        cursor.execute("""
        UPDATE users
        SET password_hash = %s, updated_at = %s
        WHERE username = 'autumn.henry'
        """, (autumn_password_hash, datetime.now()))

        if cursor.rowcount > 0:
            print(f"\nUpdated autumn.henry's password to: {password}")
            print(f"Password Hash: {autumn_password_hash}")
        else:
            print("\nUser autumn.henry not found")

        conn.commit()
        cursor.close()

    except Exception as e:
        print(f"Error: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()
