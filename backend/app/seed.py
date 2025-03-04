"""
Seed script to populate the database with initial data.

Usage:
    python -m app.seed
"""

import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.users import User, Role, Permission
from app.models.organization import Branch, EmployeeType, Employee
from app.models.operations import ItemCategory, ItemStatus
from passlib.context import CryptContext

# Password handling
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def seed_database():
    # Create a session
    db = SessionLocal()
    
    try:
        # ---- Seed Roles ----
        now = datetime.datetime.now()
        
        # Check if roles exist
        existing_roles = db.query(Role).all()
        if not existing_roles:
            admin_role = Role(
                name="admin",
                description="Administrator with full access",
                created_at=now,
                updated_at=now
            )
            
            manager_role = Role(
                name="manager",
                description="Branch manager with branch-level access",
                created_at=now,
                updated_at=now
            )
            
            employee_role = Role(
                name="employee",
                description="Regular employee with limited access",
                created_at=now,
                updated_at=now
            )
            
            db.add_all([admin_role, manager_role, employee_role])
            db.commit()
        
        # ---- Seed Permissions ----
        # Check if permissions exist
        existing_permissions = db.query(Permission).all()
        if not existing_permissions:
            permissions = [
                Permission(
                    name="users:read",
                    description="View users",
                    created_at=now,
                    updated_at=now
                ),
                Permission(
                    name="users:create",
                    description="Create users",
                    created_at=now,
                    updated_at=now
                ),
                Permission(
                    name="users:update",
                    description="Update users",
                    created_at=now,
                    updated_at=now
                ),
                Permission(
                    name="users:delete",
                    description="Delete users",
                    created_at=now,
                    updated_at=now
                ),
                Permission(
                    name="loans:read",
                    description="View loans",
                    created_at=now,
                    updated_at=now
                ),
                Permission(
                    name="loans:create",
                    description="Create loans",
                    created_at=now,
                    updated_at=now
                ),
                Permission(
                    name="loans:update",
                    description="Update loans",
                    created_at=now,
                    updated_at=now
                ),
                Permission(
                    name="reports:generate",
                    description="Generate reports",
                    created_at=now,
                    updated_at=now
                ),
            ]
            
            db.add_all(permissions)
            db.commit()
        
        # ---- Seed Branch ----
        # Check if main branch exists
        existing_branch = db.query(Branch).filter(Branch.name == "Main Branch").first()
        if not existing_branch:
            main_branch = Branch(
                name="Main Branch",
                address="123 Main Street",
                phone="123-456-7890",
                email="main@pawnshop.com",
                created_at=now,
                updated_at=now
            )
            
            db.add(main_branch)
            db.commit()
        else:
            main_branch = existing_branch
        
        # ---- Seed Default Admin User ----
        # Check if admin user exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if not existing_admin:
            # Get the admin role
            admin_role = db.query(Role).filter(Role.name == "admin").first()
            if not admin_role:
                print("Error: Admin role not found")
                return
            
            admin_user = User(
                username="admin",
                email="admin@pawnshop.com",
                password_hash=get_password_hash("admin123"),  # Change in production
                role_id=admin_role.id,
                is_active=True,
                created_at=now,
                updated_at=now
            )
            
            db.add(admin_user)
            db.commit()
        else:
            admin_user = existing_admin
        
        # ---- Seed Employee Types ----
        # Check if employee types exist
        existing_types = db.query(EmployeeType).all()
        if not existing_types:
            employee_types = [
                EmployeeType(
                    name="manager",
                    description="Branch Manager",
                    created_at=now,
                    updated_at=now
                ),
                EmployeeType(
                    name="loan_officer",
                    description="Loan Officer",
                    created_at=now,
                    updated_at=now
                ),
                EmployeeType(
                    name="appraiser",
                    description="Item Appraiser",
                    created_at=now,
                    updated_at=now
                ),
                EmployeeType(
                    name="cashier",
                    description="Cashier",
                    created_at=now,
                    updated_at=now
                ),
                EmployeeType(
                    name="admin",
                    description="System Administrator",
                    created_at=now,
                    updated_at=now
                ),
                EmployeeType(
                    name="security",
                    description="Security Staff",
                    created_at=now,
                    updated_at=now
                ),
                EmployeeType(
                    name="other",
                    description="Other Staff",
                    created_at=now,
                    updated_at=now
                )
            ]
            
            db.add_all(employee_types)
            db.commit()
        
        # ---- Seed Admin Employee ----
        # Check if admin employee exists
        existing_admin_employee = db.query(Employee).filter(Employee.user_id == admin_user.id).first()
        if not existing_admin_employee:
            # Get the manager employee type
            manager_type = db.query(EmployeeType).filter(EmployeeType.name == "manager").first()
            if not manager_type:
                print("Error: Manager employee type not found")
                return
            
            admin_employee = Employee(
                user_id=admin_user.id,
                branch_id=main_branch.id,
                employee_type_id=manager_type.id,
                hire_date=now,
                created_at=now,
                updated_at=now
            )
            
            db.add(admin_employee)
            db.commit()
        
        # ---- Seed Item Categories ----
        categories = [
            ItemCategory.JEWELRY,
            ItemCategory.ELECTRONICS,
            ItemCategory.WATCHES,
            ItemCategory.TOOLS,
            ItemCategory.MUSICAL_INSTRUMENTS
        ]
        
        print("Database seeded successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database() 