from enum import Enum
from typing import List
from fastapi import HTTPException, Depends
from functools import wraps

class Permission(str, Enum):
    # User Management
    VIEW_USERS = "view_users"
    MANAGE_USERS = "manage_users"
    
    # Customer Management
    VIEW_CUSTOMERS = "view_customers"
    MANAGE_CUSTOMERS = "manage_customers"
    
    # Loan Management
    VIEW_LOANS = "view_loans"
    CREATE_LOANS = "create_loans"
    APPROVE_LOANS = "approve_loans"
    MANAGE_LOANS = "manage_loans"
    
    # Inventory Management
    VIEW_INVENTORY = "view_inventory"
    MANAGE_INVENTORY = "manage_inventory"
    
    # Transaction Management
    VIEW_TRANSACTIONS = "view_transactions"
    MANAGE_TRANSACTIONS = "manage_transactions"
    
    # Reports
    VIEW_REPORTS = "view_reports"
    MANAGE_REPORTS = "manage_reports"
    
    # Branch Management
    VIEW_BRANCHES = "view_branches"
    MANAGE_BRANCHES = "manage_branches"

# Role definitions with their permissions
ROLE_PERMISSIONS = {
    "admin": [perm.value for perm in Permission],  # All permissions
    "manager": [
        Permission.VIEW_USERS.value,
        Permission.VIEW_CUSTOMERS.value,
        Permission.MANAGE_CUSTOMERS.value,
        Permission.VIEW_LOANS.value,
        Permission.CREATE_LOANS.value,
        Permission.APPROVE_LOANS.value,
        Permission.VIEW_INVENTORY.value,
        Permission.MANAGE_INVENTORY.value,
        Permission.VIEW_TRANSACTIONS.value,
        Permission.MANAGE_TRANSACTIONS.value,
        Permission.VIEW_REPORTS.value,
        Permission.VIEW_BRANCHES.value,
    ],
    "staff": [
        Permission.VIEW_CUSTOMERS.value,
        Permission.VIEW_LOANS.value,
        Permission.CREATE_LOANS.value,
        Permission.VIEW_INVENTORY.value,
        Permission.VIEW_TRANSACTIONS.value,
        Permission.MANAGE_TRANSACTIONS.value,
    ],
}

def has_permission(required_permissions: List[Permission]):
    """
    Decorator to check if user has required permissions
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            user = kwargs.get('current_user')
            if not user:
                raise HTTPException(status_code=401, detail="Not authenticated")
            
            user_role = user.role.name.lower() if user.role else None
            if not user_role or user_role not in ROLE_PERMISSIONS:
                raise HTTPException(status_code=403, detail="Invalid role")
            
            user_permissions = ROLE_PERMISSIONS[user_role]
            for permission in required_permissions:
                if permission.value not in user_permissions:
                    raise HTTPException(
                        status_code=403,
                        detail=f"Missing required permission: {permission.value}"
                    )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator 