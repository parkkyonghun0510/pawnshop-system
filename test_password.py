#!/usr/bin/env python3
"""
Script to test password verification with the hash from the sample data.
"""

from passlib.context import CryptContext

# Setup password hashing context similar to the one in the application
pwd_context = CryptContext(
    schemes=["bcrypt_sha256", "bcrypt"],
    deprecated="bcrypt",
    bcrypt__default_rounds=12
)

# The hash from the sample data
sample_hash = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"

# Test verification with "password"
result = pwd_context.verify("password", sample_hash)
print(f"Verification result for 'password': {result}")

# If the above fails, try some other common passwords
common_passwords = ["admin", "123456", "qwerty", "letmein", "welcome", "Password123"]
for pwd in common_passwords:
    result = pwd_context.verify(pwd, sample_hash)
    print(f"Verification result for '{pwd}': {result}")

# Generate a new hash for "password" to see what it should look like
new_hash = pwd_context.hash("password")
print(f"\nNew hash for 'password': {new_hash}")
print(f"Verification of new hash: {pwd_context.verify('password', new_hash)}")
