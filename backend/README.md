# Pawnshop Management System Backend

This directory contains the backend API for the Pawnshop Management System.

## Technology Stack

- FastAPI - Modern, fast API framework
- SQLAlchemy - ORM for database interactions
- Alembic - Database migration tool
- PostgreSQL - Database (via Supabase)

## Setup Instructions

1. **Environment Setup:**

   Create a `.env` file in the backend directory with the following content (replace with your values):

   ```
   DATABASE_URL=postgresql://postgres:your_password@db.your-supabase-project.supabase.co:5432/postgres
   SECRET_KEY=your_secret_key_for_jwt
   ```

2. **Installation:**

   ```bash
   # Create a virtual environment (optional but recommended)
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate

   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Database Migration:**

   ```bash
   # Apply migrations to create database schema
   python -m alembic upgrade head
   ```

4. **Seed Database:**

   ```bash
   # Populate the database with initial data
   python -m app.seed
   ```

5. **Run the API:**

   ```bash
   # Start the FastAPI server
   uvicorn app.main:app --reload
   ```

6. **Access the API Documentation:**

   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## Authentication

- The system uses JWT tokens for authentication
- Default admin credentials:
  - Username: admin
  - Password: admin123 (change this in production)

## Database Structure

The database schema includes the following main tables:

- **Users & Authentication**
  - users - System users
  - roles - User roles (admin, manager, employee)
  - permissions - Specific permissions
  - role_permissions - Many-to-many relationship
  - audit_logs - Tracking user actions

- **Organization**
  - branches - Pawnshop branches
  - employees - Staff members
  - employee_types - Types of employees

- **Operations**
  - customers - Customer information
  - items - Pawned or sold items
  - item_categories - Categories of items
  - loans - Loan agreements
  - payments - Loan payments
  - transactions - Financial transactions

## Development

### Adding New Models

1. Create model in `app/models/`
2. Import in `app/models/__init__.py`
3. Generate migration: `python -m alembic revision --autogenerate -m "Add new model"`
4. Apply migration: `python -m alembic upgrade head`

### Database Migrations

- Create revision: `python -m alembic revision -m "Description"`
- Autogenerate revision: `python -m alembic revision --autogenerate -m "Description"`
- Apply migrations: `python -m alembic upgrade head`
- Rollback one version: `python -m alembic downgrade -1`
- Get migration history: `python -m alembic history` 