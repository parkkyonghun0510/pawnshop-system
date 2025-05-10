"""
Seed script to populate the database with initial data.

Usage:
    python -m app.seed
"""

import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal, async_engine, get_async_db
from app.models.organization import Branch, EmployeeType, Employee
from app.models.operations import ItemCategory, ItemStatus
from app.services.users.init import initialize_default_roles_and_permissions, create_default_superuser
from passlib.context import CryptContext

# Password handling
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def seed_data():
    """Seed the database with initial data."""
    async with AsyncSessionLocal() as db:
        try:
            # Initialize default roles and permissions
            await initialize_default_roles_and_permissions(db)
            
            # Create default superuser if it doesn't exist
            result = await db.execute(select(User).where(User.is_superuser == True))
            if not result.scalar_one_or_none():
                await create_default_superuser(
                    db,
                    email="admin@example.com",
                    password="admin123"
                )
            
            print("Database seeded successfully!")
        except Exception as e:
            print(f"Error seeding database: {str(e)}")
            await db.rollback()
            
            admin_role = Role(
                name="admin",
                description="System Administrator",
                created_at=datetime.datetime.now(),
                updated_at=datetime.datetime.now()
            )
            
            manager_role = Role(
                name="manager",
                description="Branch Manager",
                created_at=datetime.datetime.now(),
                updated_at=datetime.datetime.now()
            )
            
            employee_role = Role(
                name="employee",
                description="Regular employee with limited access",
                created_at=datetime.datetime.now(),
                updated_at=datetime.datetime.now()
            )
            
            db.add_all([admin_role, manager_role, employee_role])
            await db.commit()
        
        # ---- Seed Permissions ----
        # Check if permissions exist
        existing_permissions = await db.query(Permission).all()
        if not existing_permissions:
            permissions = [
                Permission(
                    name="users:read",
                    description="View users",
                    created_at=datetime.datetime.now(),
                    updated_at=datetime.datetime.now()
                ),
                Permission(
                    name="users:create",
                    description="Create users",
                    created_at=datetime.datetime.now(),
                    updated_at=datetime.datetime.now()
                ),
                Permission(
                    name="users:update",
                    description="Update users",
                    created_at=datetime.datetime.now(),
                    updated_at=datetime.datetime.now()
                ),
                Permission(
                    name="users:delete",
                    description="Delete users",
                    created_at=datetime.datetime.now(),
                    updated_at=datetime.datetime.now()
                ),
                Permission(
                    name="loans:read",
                    description="View loans",
                    created_at=datetime.datetime.now(),
                    updated_at=datetime.datetime.now()
                ),
                Permission(
                    name="loans:create",
                    description="Create loans",
                    created_at=datetime.datetime.now(),
                    updated_at=datetime.datetime.now()
                ),
                Permission(
                    name="loans:update",
                    description="Update loans",
                    created_at=datetime.datetime.now(),
                    updated_at=datetime.datetime.now()
                ),
                Permission(
                    name="reports:generate",
                    description="Generate reports",
                    created_at=datetime.datetime.now(),
                    updated_at=datetime.datetime.now()
                ),
            ]
            
            db.add_all(permissions)
            await db.commit()
        
        # ---- Seed Branch ----
        # Check if main branch exists
        existing_branch = await db.query(Branch).filter(Branch.name == "Main Branch").first()
        if not existing_branch:
            main_branch = Branch(
                name="Main Branch",
                address="123 Main Street",
                phone="123-456-7890",
                email="main@pawnshop.com",
                created_at=datetime.datetime.now(),
                updated_at=datetime.datetime.now()
            )
            
            db.add(main_branch)
            await db.commit()
        else:
            main_branch = existing_branch
        
        # ---- Seed Default Admin User ----
        # Check if admin user exists
        existing_admin = await db.query(User).filter(User.username == "admin").first()
        if not existing_admin:
            # Get the admin role
            admin_role = await db.query(Role).filter(Role.name == "admin").first()
            if not admin_role:
                print("Error: Admin role not found")
                return
            
            admin_user = User(
                username="admin",
                email="admin@pawnshop.com",
                password_hash=get_password_hash("admin123"),  # Change in production
                role_id=admin_role.id,
                is_active=True,
                created_at=datetime.datetime.now(),
                updated_at=datetime.datetime.now()
            )
            
            db.add(admin_user)
            await db.commit()
        else:
            admin_user = existing_admin
        
        # ---- Seed Employee Types ----
        # Check if employee types exist
        existing_types = await db.query(EmployeeType).all()
        if not existing_types:
            employee_types = [
                EmployeeType(
                    name="manager",
                    description="Branch Manager",
                    created_at=datetime.datetime.now(),
                    updated_at=datetime.datetime.now()
                ),
                EmployeeType(
                    name="loan_officer",
                    description="Loan Officer",
                    created_at=datetime.datetime.now(),
                    updated_at=datetime.datetime.now()
                ),
                EmployeeType(
                    name="appraiser",
                    description="Item Appraiser",
                    created_at=datetime.datetime.now(),
                    updated_at=datetime.datetime.now()
                ),
                EmployeeType(
                    name="cashier",
                    description="Cashier",
                    created_at=datetime.datetime.now(),
                    updated_at=datetime.datetime.now()
                ),
                EmployeeType(
                    name="admin",
                    description="System Administrator",
                    created_at=datetime.datetime.now(),
                    updated_at=datetime.datetime.now()
                ),
                EmployeeType(
                    name="security",
                    description="Security Staff",
                    created_at=datetime.datetime.now(),
                    updated_at=datetime.datetime.now()
                ),
                EmployeeType(
                    name="other",
                    description="Other Staff",
                    created_at=datetime.datetime.now(),
                    updated_at=datetime.datetime.now()
                )
            ]
            
            db.add_all(employee_types)
            await db.commit()
        
        # ---- Seed Admin Employee ----
        # Check if admin employee exists
        existing_admin_employee = await db.query(Employee).filter(Employee.user_id == admin_user.id).first()
        if not existing_admin_employee:
            # Get the manager employee type
            manager_type = await db.query(EmployeeType).filter(EmployeeType.name == "manager").first()
            if not manager_type:
                print("Error: Manager employee type not found")
                return
            
            admin_employee = Employee(
                user_id=admin_user.id,
                branch_id=main_branch.id,
                employee_type_id=manager_type.id,
                hire_date=datetime.datetime.now(),
                created_at=datetime.datetime.now(),
                updated_at=datetime.datetime.now()
            )
            
            db.add(admin_employee)
            await db.commit()
        
        # ---- Seed Item Categories ----
        categories = [
            ItemCategory.JEWELRY,
            ItemCategory.ELECTRONICS,
            ItemCategory.WATCHES,
            ItemCategory.TOOLS,
        ]
        
        db.add_all(permissions)
        await db.commit()
    
    # ---- Seed Branch ----
    # Check if main branch exists
    existing_branch = await db.query(Branch).filter(Branch.name == "Main Branch").first()
    if not existing_branch:
        main_branch = Branch(
            name="Main Branch",
            address="123 Main Street",
            phone="123-456-7890",
            email="main@pawnshop.com",
            created_at=datetime.datetime.now(),
            updated_at=datetime.datetime.now()
        )
        
        db.add(main_branch)
        await db.commit()
    else:
        main_branch = existing_branch
    
    # ---- Seed Default Admin User ----
    # Check if admin user exists
    existing_admin = await db.query(User).filter(User.username == "admin").first()
    if not existing_admin:
        # Get the admin role
        admin_role = await db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            print("Error: Admin role not found")
            return
        
        admin_user = User(
            username="admin",
            email="admin@pawnshop.com",
            password_hash=get_password_hash("admin123"),  # Change in production
            role_id=admin_role.id,
            is_active=True,
            created_at=datetime.datetime.now(),
            updated_at=datetime.datetime.now()
        )
        
        db.add(admin_user)
        await db.commit()
    else:
        admin_user = existing_admin
    
    # ---- Seed Employee Types ----
    # Check if employee types exist
    existing_types = await db.query(EmployeeType).all()
    if not existing_types:
        employee_types = [
            EmployeeType(
                name="manager",
                description="Branch Manager",
                created_at=datetime.datetime.now(),
                updated_at=datetime.datetime.now()
            ),
            EmployeeType(
                name="loan_officer",
                description="Loan Officer",
                created_at=datetime.datetime.now(),
                updated_at=datetime.datetime.now()
            ),
            EmployeeType(
                name="appraiser",
                description="Item Appraiser",
                created_at=datetime.datetime.now(),
                updated_at=datetime.datetime.now()
            ),
            EmployeeType(
                name="cashier",
                description="Cashier",
                created_at=datetime.datetime.now(),
                updated_at=datetime.datetime.now()
            ),
            EmployeeType(
                name="admin",
                description="System Administrator",
                created_at=datetime.datetime.now(),
                updated_at=datetime.datetime.now()
            ),
            EmployeeType(
                name="security",
                description="Security Staff",
                created_at=datetime.datetime.now(),
                updated_at=datetime.datetime.now()
            ),
            EmployeeType(
                name="other",
                description="Other Staff",
                created_at=datetime.datetime.now(),
                updated_at=datetime.datetime.now()
            )
        ]
        
        db.add_all(employee_types)
        await db.commit()
    
    # ---- Seed Admin Employee ----
    # Check if admin employee exists
    existing_admin_employee = await db.query(Employee).filter(Employee.user_id == admin_user.id).first()
    if not existing_admin_employee:
        # Get the manager employee type
        manager_type = await db.query(EmployeeType).filter(EmployeeType.name == "manager").first()
        if not manager_type:
            print("Error: Manager employee type not found")
            return
        
        admin_employee = Employee(
            user_id=admin_user.id,
            branch_id=main_branch.id,
            employee_type_id=manager_type.id,
            hire_date=datetime.datetime.now(),
            created_at=datetime.datetime.now(),
            updated_at=datetime.datetime.now()
        )
        
        db.add(admin_employee)
        await db.commit()
    
    # ---- Seed Item Categories ----
    categories = [
        ItemCategory.JEWELRY,
        ItemCategory.ELECTRONICS,
        ItemCategory.WATCHES,
        ItemCategory.TOOLS,
        ItemCategory.MUSICAL_INSTRUMENTS
    ]
    
    print("Database seeded successfully!")
    db.close()

if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_data())