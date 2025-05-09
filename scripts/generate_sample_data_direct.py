#!/usr/bin/env python3
"""
Script to generate sample data for the pawnshop system.
This script connects directly to the database without using the application models.
"""

import os
import random
import argparse
from datetime import datetime, timedelta
import faker
import psycopg2

# Initialize faker
fake = faker.Faker()

# Configuration
DEFAULT_NUM_CUSTOMERS = 50
DEFAULT_NUM_ITEMS = 100
DEFAULT_NUM_LOANS = 80
DEFAULT_NUM_TRANSACTIONS = 120
DEFAULT_NUM_BRANCHES = 3
DEFAULT_NUM_EMPLOYEES = 10

# Item categories (must match the enum values in the database)
ITEM_CATEGORIES = [
    "JEWELRY", "ELECTRONICS", "WATCHES", "MUSICAL_INSTRUMENTS", "TOOLS"
]

# Item names by category
ITEM_NAMES = {
    "JEWELRY": ["Gold Necklace", "Diamond Ring", "Silver Bracelet", "Pearl Earrings", "Gold Watch"],
    "ELECTRONICS": ["Flat Screen TV", "Home Theater System", "Bluetooth Speaker", "Gaming Console", "Tablet"],
    "WATCHES": ["Rolex Watch", "Omega Watch", "Seiko Watch", "Citizen Watch", "Casio Watch"],
    "MUSICAL_INSTRUMENTS": ["Electric Guitar", "Acoustic Guitar", "Drum Set", "Keyboard", "Violin"],
    "TOOLS": ["Power Drill", "Circular Saw", "Tool Set", "Air Compressor", "Welding Machine"]
}

# Loan status enum values
LOAN_STATUS = {
    "ACTIVE": "active",
    "OVERDUE": "overdue",
    "COMPLETED": "completed",
    "DEFAULTED": "defaulted"
}

# Transaction types (must match the enum values in the database)
TRANSACTION_TYPES = ["SALE", "PAYMENT", "REDEMPTION"]

# Payment methods
PAYMENT_METHODS = ["CASH", "CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER", "MOBILE_PAYMENT", "CHECK"]

# Transaction status
TRANSACTION_STATUS = ["PENDING", "COMPLETED", "CANCELLED", "REFUNDED"]

# Item status (must match the enum values in the database)
ITEM_STATUS = ["AVAILABLE", "PAWNED", "SOLD", "EXPIRED"]

def connect_to_db():
    """Connect to the PostgreSQL database"""
    conn = psycopg2.connect(
        os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost/pawnshop")
    )
    conn.autocommit = False
    return conn

def clear_data(conn):
    """Clear existing data from the database"""
    cursor = conn.cursor()

    # Clear tables in reverse order of dependencies
    tables = [
        "payments",
        "transactions",
        "loans",
        "items",
        "customers",
        "employees",
        "users",
        "employee_types",
        "branches"
    ]

    for table in tables:
        cursor.execute(f"TRUNCATE TABLE {table} CASCADE;")

    conn.commit()
    cursor.close()

def create_branches(conn, num_branches):
    """Create sample branches"""
    cursor = conn.cursor()
    branches = []
    cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego"]

    for i in range(num_branches):
        city = cities[i % len(cities)]
        branch = {
            "name": f"{city} Branch",
            "address": fake.address()[:100],  # Limit length
            "phone": fake.phone_number()[:20],  # Limit length
            "email": f"branch{i+1}@pawnshop.com",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }

        query = """
        INSERT INTO branches (name, address, phone, email, created_at, updated_at)
        VALUES (%(name)s, %(address)s, %(phone)s, %(email)s, %(created_at)s, %(updated_at)s)
        RETURNING id;
        """

        cursor.execute(query, branch)
        branch_id = cursor.fetchone()[0]
        branch["id"] = branch_id
        branches.append(branch)

    conn.commit()
    cursor.close()
    return branches

def create_employee_types(conn):
    """Create sample employee types"""
    cursor = conn.cursor()
    employee_types = []

    types = [
        {"name": "Manager", "description": "Branch manager responsible for overall operations"},
        {"name": "Clerk", "description": "Front desk clerk handling customer interactions"},
        {"name": "Appraiser", "description": "Evaluates and appraises items"},
        {"name": "Security", "description": "Maintains security of the premises"}
    ]

    for type_data in types:
        type_data["created_at"] = datetime.now()
        type_data["updated_at"] = datetime.now()

        query = """
        INSERT INTO employee_types (name, description, created_at, updated_at)
        VALUES (%(name)s, %(description)s, %(created_at)s, %(updated_at)s)
        RETURNING id;
        """

        cursor.execute(query, type_data)
        type_id = cursor.fetchone()[0]
        type_data["id"] = type_id
        employee_types.append(type_data)

    conn.commit()
    cursor.close()
    return employee_types

def create_users(conn, num_users):
    """Create sample users"""
    cursor = conn.cursor()
    users = []

    # First, get a role ID to assign to users
    cursor.execute("SELECT id FROM roles LIMIT 1")
    role_result = cursor.fetchone()
    role_id = role_result[0] if role_result else None

    for i in range(num_users):
        first_name = fake.first_name()
        last_name = fake.last_name()
        username = f"{first_name.lower()}.{last_name.lower()}"

        user = {
            "username": username[:50],
            "email": f"{username[:40]}@example.com",
            "password_hash": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "password"
            "first_name": first_name[:50],
            "last_name": last_name[:50],
            "is_active": True,
            "is_superuser": i == 0,  # First user is superuser
            "role_id": role_id,  # Assign role_id if available
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }

        query = """
        INSERT INTO users (username, email, password_hash, first_name, last_name, is_active, is_superuser, role_id, created_at, updated_at)
        VALUES (%(username)s, %(email)s, %(password_hash)s, %(first_name)s, %(last_name)s, %(is_active)s, %(is_superuser)s, %(role_id)s, %(created_at)s, %(updated_at)s)
        RETURNING id;
        """

        cursor.execute(query, user)
        user_id = cursor.fetchone()[0]
        user["id"] = user_id
        users.append(user)

    conn.commit()
    cursor.close()
    return users

def create_employees(conn, num_employees, branches, users, employee_types):
    """Create sample employees"""
    cursor = conn.cursor()
    employees = []

    for i in range(min(num_employees, len(users))):
        branch = random.choice(branches)
        employee_type = random.choice(employee_types)
        user = users[i]  # Assign each user to be an employee

        employee = {
            "user_id": user["id"],
            "branch_id": branch["id"],
            "employee_type_id": employee_type["id"],
            "hire_date": fake.date_between(start_date="-3y", end_date="today"),
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }

        query = """
        INSERT INTO employees (user_id, branch_id, employee_type_id, hire_date, created_at, updated_at)
        VALUES (%(user_id)s, %(branch_id)s, %(employee_type_id)s, %(hire_date)s, %(created_at)s, %(updated_at)s)
        RETURNING id;
        """

        cursor.execute(query, employee)
        employee_id = cursor.fetchone()[0]
        employee["id"] = employee_id
        employees.append(employee)

    conn.commit()
    cursor.close()
    return employees

def create_customers(conn, num_customers):
    """Create sample customers"""
    cursor = conn.cursor()
    customers = []

    for _ in range(num_customers):
        created_at = fake.date_time_between(start_date="-1y", end_date="now")
        customer_code = f"C{fake.bothify(text='######')}"
        customer = {
            "customer_code": customer_code,
            "first_name": fake.first_name()[:50],
            "last_name": fake.last_name()[:50],
            "email": fake.email()[:100],
            "phone": fake.phone_number()[:20],
            "address": fake.street_address()[:100],
            "city": fake.city()[:50],
            "state": fake.state_abbr(),
            "country": "USA",
            "zip_code": fake.zipcode()[:20],
            "id_type": random.choice(["Driver's License", "Passport", "State ID"]),
            "id_number": fake.ssn()[:20],
            "date_of_birth": fake.date_of_birth(minimum_age=18, maximum_age=80),
            "is_active": True,
            "created_at": created_at,
            "updated_at": created_at
        }

        query = """
        INSERT INTO customers (customer_code, first_name, last_name, email, phone, address, city, state, country, zip_code, id_type, id_number, date_of_birth, is_active, created_at, updated_at)
        VALUES (%(customer_code)s, %(first_name)s, %(last_name)s, %(email)s, %(phone)s, %(address)s, %(city)s, %(state)s, %(country)s, %(zip_code)s, %(id_type)s, %(id_number)s, %(date_of_birth)s, %(is_active)s, %(created_at)s, %(updated_at)s)
        RETURNING id;
        """

        cursor.execute(query, customer)
        customer_id = cursor.fetchone()[0]
        customer["id"] = customer_id
        customers.append(customer)

    conn.commit()
    cursor.close()
    return customers

def create_items(conn, num_items, branches):
    """Create sample inventory items"""
    cursor = conn.cursor()
    items = []

    for _ in range(num_items):
        # Select random category and name
        category = random.choice(ITEM_CATEGORIES)
        name = random.choice(ITEM_NAMES[category])

        # Random branch
        branch = random.choice(branches)

        # Random status based on database enum
        status = random.choice(ITEM_STATUS)

        # Random appraised value based on category
        if category in ["Jewelry", "Watches", "Antiques"]:
            appraised_value = round(random.uniform(500, 5000), 2)
        elif category in ["Electronics", "Computers", "Smartphones"]:
            appraised_value = round(random.uniform(200, 2000), 2)
        else:
            appraised_value = round(random.uniform(50, 1000), 2)

        created_at = fake.date_time_between(start_date="-1y", end_date="now")

        # Create item
        item_code = f"I{fake.bothify(text='######')}"
        acquisition_date = fake.date_time_between(start_date="-1y", end_date="now")

        # Create item
        item = {
            "item_code": item_code,
            "name": name[:100],
            "description": fake.text(max_nb_chars=200)[:200],
            "category": category,
            "serial_number": fake.bothify(text="??-########")[:20] if random.random() > 0.3 else None,
            "appraised_value": appraised_value,
            "loan_value": round(appraised_value * 0.7, 2),  # 70% of appraised value
            "sale_price": round(appraised_value * 1.2, 2) if status == "SOLD" else None,  # 120% of appraised value
            "condition": random.choice(["Excellent", "Good", "Fair", "Poor"]),
            "status": status,
            "branch_id": branch["id"],
            "acquisition_date": acquisition_date,
            "redemption_deadline": (acquisition_date + timedelta(days=30)) if status == "PAWNED" else None,
            "sold_date": fake.date_time_between(start_date="-6m", end_date="now") if status == "SOLD" else None,
            "storage_location": f"Section {random.choice('ABCDE')}-{random.randint(1, 20)}"[:50],
            "created_at": created_at,
            "updated_at": created_at
        }

        query = """
        INSERT INTO items (item_code, name, description, category, serial_number, appraised_value, loan_value, sale_price,
                          condition, status, branch_id, acquisition_date, redemption_deadline, sold_date, storage_location, created_at, updated_at)
        VALUES (%(item_code)s, %(name)s, %(description)s, %(category)s, %(serial_number)s, %(appraised_value)s, %(loan_value)s, %(sale_price)s,
                %(condition)s, %(status)s, %(branch_id)s, %(acquisition_date)s, %(redemption_deadline)s, %(sold_date)s, %(storage_location)s, %(created_at)s, %(updated_at)s)
        RETURNING id;
        """

        cursor.execute(query, item)
        item_id = cursor.fetchone()[0]
        item["id"] = item_id
        items.append(item)

    conn.commit()
    cursor.close()
    return items

def create_loans(conn, num_loans, customers, items):
    """Create sample loans"""
    cursor = conn.cursor()
    loans = []

    # Get pawned items
    pawned_items = [item for item in items if item["status"] == "PAWNED"]

    # If we don't have enough pawned items, update some available items to pawned
    if len(pawned_items) < num_loans:
        available_items = [item for item in items if item["status"] == "AVAILABLE"]
        num_to_convert = min(num_loans - len(pawned_items), len(available_items))

        for i in range(num_to_convert):
            item = available_items[i]
            item["status"] = "PAWNED"

            update_query = """
            UPDATE items SET status = 'PAWNED', updated_at = %s WHERE id = %s;
            """

            cursor.execute(update_query, (datetime.now(), item["id"]))
            pawned_items.append(item)

        conn.commit()

    # Create loans for pawned items
    today = datetime.now()

    for i in range(min(num_loans, len(pawned_items))):
        item = pawned_items[i]
        customer = random.choice(customers)

        # Random loan creation date in the past year
        created_at = fake.date_time_between(start_date="-1y", end_date="now")

        # Random loan term (7, 14, 30, 60, or 90 days)
        term_days = random.choice([7, 14, 30, 60, 90])

        # Calculate start and due dates
        start_date = created_at.date()
        due_date = start_date + timedelta(days=term_days)

        # Determine loan status based on due date
        if due_date > today.date():
            status = LOAN_STATUS["ACTIVE"]
        else:
            # If past due date, randomly choose between overdue, completed, or defaulted
            status = random.choices(
                [LOAN_STATUS["OVERDUE"], LOAN_STATUS["COMPLETED"], LOAN_STATUS["DEFAULTED"]],
                weights=[0.4, 0.4, 0.2],
                k=1
            )[0]

        # Calculate loan amount (typically 60-80% of appraised value)
        loan_percentage = random.uniform(0.6, 0.8)
        principal_amount = round(float(item["appraised_value"]) * loan_percentage, 2)

        # Random interest rate between 5% and 25%
        interest_rate = round(random.uniform(5, 25), 2)

        # Create loan
        loan_number = f"L{fake.bothify(text='######')}"
        remaining_balance = principal_amount

        # For completed loans, set remaining balance to 0
        if status == LOAN_STATUS["COMPLETED"]:
            remaining_balance = 0
            actual_end_date = fake.date_between(start_date=start_date, end_date=due_date)
        else:
            actual_end_date = None

        # Random extension count
        extension_count = random.randint(0, 2) if random.random() > 0.7 else 0

        # If there are extensions, add extended due date
        extended_due_date = None
        if extension_count > 0:
            extended_due_date = due_date + timedelta(days=term_days * extension_count)

        # Create loan
        loan = {
            "loan_number": loan_number,
            "customer_id": customer["id"],
            "item_id": item["id"],
            "principal_amount": principal_amount,
            "interest_rate": interest_rate,
            "term_days": term_days,
            "start_date": start_date,
            "due_date": due_date,
            "extended_due_date": extended_due_date,
            "status": status,
            "actual_end_date": actual_end_date,
            "total_paid": 0,  # Will be updated after payments are created
            "remaining_balance": remaining_balance,
            "extension_count": extension_count,
            "created_at": created_at,
            "updated_at": created_at
        }

        query = """
        INSERT INTO loans (loan_number, customer_id, item_id, principal_amount, interest_rate, term_days,
                          start_date, due_date, extended_due_date, status, actual_end_date, total_paid,
                          remaining_balance, extension_count, created_at, updated_at)
        VALUES (%(loan_number)s, %(customer_id)s, %(item_id)s, %(principal_amount)s, %(interest_rate)s, %(term_days)s,
                %(start_date)s, %(due_date)s, %(extended_due_date)s, %(status)s, %(actual_end_date)s, %(total_paid)s,
                %(remaining_balance)s, %(extension_count)s, %(created_at)s, %(updated_at)s)
        RETURNING id;
        """

        cursor.execute(query, loan)
        loan_id = cursor.fetchone()[0]
        loan["id"] = loan_id
        loans.append(loan)

    conn.commit()
    cursor.close()
    return loans

def create_payments(conn, loans):
    """Create sample payments for loans"""
    cursor = conn.cursor()
    payments = []

    for loan in loans:
        # Skip defaulted loans
        if loan["status"] == LOAN_STATUS["DEFAULTED"]:
            continue

        # For completed loans, create full payment
        if loan["status"] == LOAN_STATUS["COMPLETED"]:
            # Calculate total amount with interest
            interest_amount = loan["principal_amount"] * (loan["interest_rate"] / 100) * (loan["term_days"] / 30)
            total_amount = loan["principal_amount"] + interest_amount

            payment_date = fake.date_between(start_date=loan["start_date"], end_date=loan["due_date"])
            created_at = datetime.combine(payment_date, datetime.min.time())

            payment = {
                "loan_id": loan["id"],
                "amount": round(total_amount, 2),
                "payment_date": payment_date,
                "created_at": created_at
            }

            query = """
            INSERT INTO payments (loan_id, amount, payment_date, created_at)
            VALUES (%(loan_id)s, %(amount)s, %(payment_date)s, %(created_at)s)
            RETURNING id;
            """

            cursor.execute(query, payment)
            payment_id = cursor.fetchone()[0]
            payment["id"] = payment_id
            payments.append(payment)

        # For active or overdue loans, create partial payments
        else:
            # Random number of payments (0-3)
            num_payments = random.randint(0, 3)

            for _ in range(num_payments):
                # Random payment amount (10-50% of principal)
                payment_percentage = random.uniform(0.1, 0.5)
                amount = round(loan["principal_amount"] * payment_percentage, 2)

                # Payment date between start date and now
                payment_date = fake.date_between(start_date=loan["start_date"], end_date=datetime.now().date())
                created_at = datetime.combine(payment_date, datetime.min.time())

                payment = {
                    "loan_id": loan["id"],
                    "amount": amount,
                    "payment_date": payment_date,
                    "created_at": created_at
                }

                query = """
                INSERT INTO payments (loan_id, amount, payment_date, created_at)
                VALUES (%(loan_id)s, %(amount)s, %(payment_date)s, %(created_at)s)
                RETURNING id;
                """

                cursor.execute(query, payment)
                payment_id = cursor.fetchone()[0]
                payment["id"] = payment_id
                payments.append(payment)

    conn.commit()
    cursor.close()
    return payments

def create_transactions(conn, num_transactions, customers, items, branches):
    """Create sample transactions (sales, purchases, etc.)"""
    cursor = conn.cursor()
    transactions = []

    # Get sold items
    sold_items = [item for item in items if item["status"] == "SOLD"]

    # If we don't have enough sold items, update some available items to sold
    if len(sold_items) < num_transactions // 2:
        available_items = [item for item in items if item["status"] == "AVAILABLE"]
        num_to_convert = min(num_transactions // 2 - len(sold_items), len(available_items))

        for i in range(num_to_convert):
            item = available_items[i]
            item["status"] = "SOLD"

            update_query = """
            UPDATE items SET status = 'SOLD', updated_at = %s WHERE id = %s;
            """

            cursor.execute(update_query, (datetime.now(), item["id"]))
            sold_items.append(item)

        conn.commit()

    # Create sales transactions
    for item in sold_items:
        customer = random.choice(customers)
        branch = random.choice(branches)

        # Sale amount is typically 100-150% of appraised value
        sale_percentage = random.uniform(1.0, 1.5)
        amount = round(float(item["appraised_value"]) * sale_percentage, 2)

        # Transaction date in the past year
        transaction_date = fake.date_time_between(start_date="-1y", end_date="now")

        transaction = {
            "transaction_number": f"T{fake.bothify(text='######')}",
            "transaction_date": transaction_date,
            "transaction_type": "SALE",
            "amount": amount,
            "customer_id": customer["id"],
            "branch_id": branch["id"],
            "created_at": transaction_date
        }

        query = """
        INSERT INTO transactions (transaction_number, transaction_date, transaction_type, amount, customer_id, branch_id, created_at)
        VALUES (%(transaction_number)s, %(transaction_date)s, %(transaction_type)s, %(amount)s, %(customer_id)s, %(branch_id)s, %(created_at)s)
        RETURNING id;
        """

        cursor.execute(query, transaction)
        transaction_id = cursor.fetchone()[0]
        transaction["id"] = transaction_id
        transactions.append(transaction)

    # Create other types of transactions
    remaining_transactions = num_transactions - len(sold_items)

    for _ in range(remaining_transactions):
        customer = random.choice(customers)
        branch = random.choice(branches)

        # Random transaction type (excluding SALE which we already handled)
        transaction_type = random.choice([t for t in TRANSACTION_TYPES if t != "SALE"])

        # Amount based on transaction type
        if transaction_type == "PAYMENT":
            amount = round(random.uniform(50, 500), 2)
        else:  # REDEMPTION
            amount = round(random.uniform(100, 2000), 2)

        # Transaction date in the past year
        transaction_date = fake.date_time_between(start_date="-1y", end_date="now")

        transaction = {
            "transaction_number": f"T{fake.bothify(text='######')}",
            "transaction_date": transaction_date,
            "transaction_type": transaction_type,
            "amount": amount,
            "customer_id": customer["id"],
            "branch_id": branch["id"],
            "created_at": transaction_date
        }

        query = """
        INSERT INTO transactions (transaction_number, transaction_date, transaction_type, amount, customer_id, branch_id, created_at)
        VALUES (%(transaction_number)s, %(transaction_date)s, %(transaction_type)s, %(amount)s, %(customer_id)s, %(branch_id)s, %(created_at)s)
        RETURNING id;
        """

        cursor.execute(query, transaction)
        transaction_id = cursor.fetchone()[0]
        transaction["id"] = transaction_id
        transactions.append(transaction)

    conn.commit()
    cursor.close()
    return transactions

def main():
    """Main function to generate sample data"""
    parser = argparse.ArgumentParser(description='Generate sample data for the pawnshop system')
    parser.add_argument('--customers', type=int, default=DEFAULT_NUM_CUSTOMERS, help='Number of customers to generate')
    parser.add_argument('--items', type=int, default=DEFAULT_NUM_ITEMS, help='Number of items to generate')
    parser.add_argument('--loans', type=int, default=DEFAULT_NUM_LOANS, help='Number of loans to generate')
    parser.add_argument('--transactions', type=int, default=DEFAULT_NUM_TRANSACTIONS, help='Number of transactions to generate')
    parser.add_argument('--branches', type=int, default=DEFAULT_NUM_BRANCHES, help='Number of branches to generate')
    parser.add_argument('--employees', type=int, default=DEFAULT_NUM_EMPLOYEES, help='Number of employees to generate')
    parser.add_argument('--clear', action='store_true', help='Clear existing data before generating new data')

    args = parser.parse_args()

    try:
        # Connect to database
        conn = connect_to_db()

        print("Starting sample data generation...")

        if args.clear:
            print("Clearing existing data...")
            clear_data(conn)
            print("Existing data cleared.")

        # Create branches
        print(f"Generating {args.branches} branches...")
        branches = create_branches(conn, args.branches)
        print(f"Created {len(branches)} branches.")

        # Create employee types
        print("Generating employee types...")
        employee_types = create_employee_types(conn)
        print(f"Created {len(employee_types)} employee types.")

        # Create users
        print(f"Generating {args.employees} users...")
        users = create_users(conn, args.employees)
        print(f"Created {len(users)} users.")

        # Create employees
        print(f"Generating {args.employees} employees...")
        employees = create_employees(conn, args.employees, branches, users, employee_types)
        print(f"Created {len(employees)} employees.")

        # Create customers
        print(f"Generating {args.customers} customers...")
        customers = create_customers(conn, args.customers)
        print(f"Created {len(customers)} customers.")

        # Create items
        print(f"Generating {args.items} items...")
        items = create_items(conn, args.items, branches)
        print(f"Created {len(items)} items.")

        # Create loans
        print(f"Generating {args.loans} loans...")
        loans = create_loans(conn, args.loans, customers, items)
        print(f"Created {len(loans)} loans.")

        # Create payments
        print("Generating payments for loans...")
        payments = create_payments(conn, loans)
        print(f"Created {len(payments)} payments.")

        # Create transactions
        print(f"Generating {args.transactions} transactions...")
        transactions = create_transactions(conn, args.transactions, customers, items, branches)
        print(f"Created {len(transactions)} transactions.")

        print("Sample data generation complete!")

    except Exception as e:
        print(f"Error generating sample data: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()
