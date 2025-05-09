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

## Updated API Documentation

### Authentication Endpoints
- **POST** `/api/v1/authentication/auth/token`: Obtain an access token for authentication.
- **POST** `/api/v1/authentication/auth/register`: Register a new user.
- **POST** `/api/v1/authentication/auth/password-reset`: Request a password reset.
- **POST** `/api/v1/authentication/auth/change-password`: Change the current user's password.
- **GET** `/api/v1/authentication/auth/me`: Retrieve the current user's information.
- **POST** `/api/v1/authentication/auth/logout`: Log out the current user.
- **GET** `/api/v1/authentication/auth/verify`: Verify the current user's token.

### User Management Endpoints
- **GET** `/api/v1/users`: Retrieve a list of users.
- **POST** `/api/v1/users`: Create a new user.
- **GET** `/api/v1/users/{id}`: Retrieve a specific user by ID.
- **PUT** `/api/v1/users/{id}`: Update a specific user by ID.
- **DELETE** `/api/v1/users/{id}`: Delete a specific user by ID.

### Branch Management Endpoints
- **GET** `/api/v1/branches`: Retrieve a list of branches.
- **POST** `/api/v1/branches`: Create a new branch.
- **GET** `/api/v1/branches/{id}`: Retrieve a specific branch by ID.
- **PUT** `/api/v1/branches/{id}`: Update a specific branch by ID.
- **DELETE** `/api/v1/branches/{id}`: Delete a specific branch by ID.

### Inventory Management Endpoints
- **GET** `/api/v1/inventory`: Retrieve a list of inventory items.
- **POST** `/api/v1/inventory`: Add a new inventory item.
- **GET** `/api/v1/inventory/{id}`: Retrieve a specific inventory item by ID.
- **PUT** `/api/v1/inventory/{id}`: Update a specific inventory item by ID.
- **DELETE** `/api/v1/inventory/{id}`: Delete a specific inventory item by ID.

### Loan Management Endpoints
- **GET** `/api/v1/loans`: Retrieve a list of loans.
- **POST** `/api/v1/loans`: Create a new loan.
- **GET** `/api/v1/loans/{id}`: Retrieve a specific loan by ID.
- **PUT** `/api/v1/loans/{id}`: Update a specific loan by ID.
- **DELETE** `/api/v1/loans/{id}`: Delete a specific loan by ID.

### Transaction Management Endpoints
- **GET** `/api/v1/transactions`: Retrieve a list of transactions.
- **POST** `/api/v1/transactions`: Create a new transaction.
- **GET** `/api/v1/transactions/{id}`: Retrieve a specific transaction by ID.

### Reporting Endpoints
- **GET** `/api/v1/reports`: Retrieve a list of reports.
- **POST** `/api/v1/reports/generate`: Generate a new report.
- **GET** `/api/v1/reports/{id}/download`: Download a specific report.

### Dashboard Endpoints
- **GET** `/api/v1/dashboard/inventory-status`: Retrieve inventory status for the dashboard.
- **GET** `/api/v1/dashboard/recent-transactions`: Retrieve recent transactions for the dashboard.
- **GET** `/api/v1/dashboard/upcoming-due-loans`: Retrieve upcoming due loans for the dashboard.