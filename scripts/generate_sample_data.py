#!/usr/bin/env python3
"""
Script to generate sample data for the pawnshop system.
This will create realistic data for customers, items, loans, transactions, and payments.
"""

import sys
import os
import random
from datetime import datetime, timedelta
import argparse
from decimal import Decimal
import uuid
import faker

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import get_db, Base
from backend.app.models.users import User
from backend.app.models.operations import Loan, Payment, Item, Customer, Transaction
from backend.app.models.organization import Branch, Employee
from backend.app.schemas.loans import LoanStatusEnum
from backend.app.schemas.transactions import TransactionStatusEnum, TransactionType, PaymentMethodEnum

# Initialize faker
fake = faker.Faker()

# Configuration
DEFAULT_NUM_CUSTOMERS = 50
DEFAULT_NUM_ITEMS = 100
DEFAULT_NUM_LOANS = 80
DEFAULT_NUM_TRANSACTIONS = 120
DEFAULT_NUM_BRANCHES = 3
DEFAULT_NUM_EMPLOYEES = 10

# Item categories
ITEM_CATEGORIES = [
    "Jewelry", "Electronics", "Watches", "Musical Instruments",
    "Tools", "Collectibles", "Cameras", "Computers", "Smartphones",
    "Antiques", "Sporting Goods", "Designer Items"
]

# Item names by category
ITEM_NAMES = {
    "Jewelry": ["Gold Necklace", "Diamond Ring", "Silver Bracelet", "Pearl Earrings", "Gold Watch"],
    "Electronics": ["Flat Screen TV", "Home Theater System", "Bluetooth Speaker", "Gaming Console", "Tablet"],
    "Watches": ["Rolex Watch", "Omega Watch", "Seiko Watch", "Citizen Watch", "Casio Watch"],
    "Musical Instruments": ["Electric Guitar", "Acoustic Guitar", "Drum Set", "Keyboard", "Violin"],
    "Tools": ["Power Drill", "Circular Saw", "Tool Set", "Air Compressor", "Welding Machine"],
    "Collectibles": ["Rare Coin", "Comic Book", "Sports Card", "Action Figure", "Vintage Toy"],
    "Cameras": ["DSLR Camera", "Mirrorless Camera", "Vintage Camera", "Video Camera", "Camera Lens"],
    "Computers": ["Laptop", "Desktop Computer", "Gaming PC", "Mac Computer", "Computer Monitor"],
    "Smartphones": ["iPhone", "Samsung Galaxy", "Google Pixel", "OnePlus", "Xiaomi"],
    "Antiques": ["Antique Clock", "Vintage Furniture", "Antique Vase", "Old Painting", "Vintage Lamp"],
    "Sporting Goods": ["Golf Clubs", "Bicycle", "Fishing Rod", "Treadmill", "Weights Set"],
    "Designer Items": ["Designer Handbag", "Designer Shoes", "Designer Sunglasses", "Designer Watch", "Designer Clothing"]
}

def create_branches(db: Session, num_branches: int) -> list:
    """Create sample branches"""
    branches = []
    cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego"]

    for i in range(num_branches):
        city = cities[i % len(cities)]
        branch = Branch(
            name=f"{city} Branch",
            address=fake.address(),
            city=city,
            state=fake.state_abbr(),
            zip_code=fake.zipcode(),
            phone=fake.phone_number(),
            email=f"branch{i+1}@pawnshop.com",
            is_active=True
        )
        db.add(branch)
        branches.append(branch)

    db.commit()
    return branches

def create_employees(db: Session, num_employees: int, branches: list) -> list:
    """Create sample employees"""
    employees = []

    for i in range(num_employees):
        branch = random.choice(branches)
        employee = Employee(
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            email=fake.email(),
            phone=fake.phone_number(),
            position=random.choice(["Manager", "Clerk", "Appraiser", "Security"]),
            hire_date=fake.date_between(start_date="-3y", end_date="today"),
            branch_id=branch.id,
            is_active=True
        )
        db.add(employee)
        employees.append(employee)

    db.commit()
    return employees

def create_customers(db: Session, num_customers: int) -> list:
    """Create sample customers"""
    customers = []

    for _ in range(num_customers):
        # Create customer with random data
        customer = Customer(
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            email=fake.email(),
            phone=fake.phone_number(),
            address=fake.street_address(),
            city=fake.city(),
            state=fake.state_abbr(),
            zip_code=fake.zipcode(),
            id_type=random.choice(["Driver's License", "Passport", "State ID"]),
            id_number=fake.ssn(),
            date_of_birth=fake.date_of_birth(minimum_age=18, maximum_age=80),
            is_active=True,
            created_at=fake.date_time_between(start_date="-1y", end_date="now")
        )
        db.add(customer)
        customers.append(customer)

    db.commit()
    return customers

def create_items(db: Session, num_items: int, branches: list) -> list:
    """Create sample inventory items"""
    items = []

    for _ in range(num_items):
        # Select random category and name
        category = random.choice(ITEM_CATEGORIES)
        name = random.choice(ITEM_NAMES[category])

        # Random branch
        branch = random.choice(branches)

        # Random status based on database enum
        status = random.choice(['AVAILABLE', 'PAWNED', 'SOLD', 'EXPIRED'])

        # Random appraised value based on category
        if category in ["Jewelry", "Watches", "Antiques"]:
            appraised_value = round(random.uniform(500, 5000), 2)
        elif category in ["Electronics", "Computers", "Smartphones"]:
            appraised_value = round(random.uniform(200, 2000), 2)
        else:
            appraised_value = round(random.uniform(50, 1000), 2)

        # Create item
        item = Item(
            name=name,
            description=fake.text(max_nb_chars=200),
            category=category,
            serial_number=fake.bothify(text="??-########") if random.random() > 0.3 else None,
            appraised_value=appraised_value,
            condition=random.choice(["Excellent", "Good", "Fair", "Poor"]),
            status=status,
            branch_id=branch.id,
            created_at=fake.date_time_between(start_date="-1y", end_date="now")
        )
        db.add(item)
        items.append(item)

    db.commit()
    return items

def create_loans(db: Session, num_loans: int, customers: list, items: list, branches: list) -> list:
    """Create sample loans"""
    loans = []

    # Get pawned items
    pawned_items = [item for item in items if item.status == 'PAWNED']

    # If we don't have enough pawned items, update some available items to pawned
    if len(pawned_items) < num_loans:
        available_items = [item for item in items if item.status == 'AVAILABLE']
        num_to_convert = min(num_loans - len(pawned_items), len(available_items))

        for i in range(num_to_convert):
            available_items[i].status = 'PAWNED'
            pawned_items.append(available_items[i])

        db.commit()

    # Create loans for pawned items
    today = datetime.now()

    for i in range(min(num_loans, len(pawned_items))):
        item = pawned_items[i]
        customer = random.choice(customers)
        branch = random.choice(branches)

        # Random loan creation date in the past year
        created_at = fake.date_time_between(start_date="-1y", end_date="now")

        # Random loan term (7, 14, 30, 60, or 90 days)
        term_days = random.choice([7, 14, 30, 60, 90])

        # Calculate start and due dates
        start_date = created_at.date()
        due_date = start_date + timedelta(days=term_days)

        # Determine loan status based on due date
        if due_date > today.date():
            status = LoanStatusEnum.ACTIVE.value
        else:
            # If past due date, randomly choose between overdue, completed, or defaulted
            status = random.choices(
                [LoanStatusEnum.OVERDUE.value, LoanStatusEnum.COMPLETED.value, LoanStatusEnum.DEFAULTED.value],
                weights=[0.4, 0.4, 0.2],
                k=1
            )[0]

        # Calculate loan amount (typically 60-80% of appraised value)
        loan_percentage = random.uniform(0.6, 0.8)
        principal_amount = round(float(item.appraised_value) * loan_percentage, 2)

        # Random interest rate between 5% and 25%
        interest_rate = round(random.uniform(5, 25), 2)

        # Create loan
        loan = Loan(
            loan_code=f"L{fake.bothify(text='######')}",
            customer_id=customer.id,
            item_id=item.id,
            branch_id=branch.id,
            principal_amount=principal_amount,
            interest_rate=interest_rate,
            term_days=term_days,
            start_date=start_date,
            due_date=due_date,
            status=status,
            created_at=created_at
        )
        db.add(loan)
        loans.append(loan)

    db.commit()
    return loans

def create_payments(db: Session, loans: list) -> list:
    """Create sample payments for loans"""
    payments = []

    for loan in loans:
        # Skip defaulted loans
        if loan.status == LoanStatusEnum.DEFAULTED.value:
            continue

        # For completed loans, create full payment
        if loan.status == LoanStatusEnum.COMPLETED.value:
            # Calculate total amount with interest
            interest_amount = loan.principal_amount * (loan.interest_rate / 100) * (loan.term_days / 30)
            total_amount = loan.principal_amount + interest_amount

            payment_date = fake.date_between(start_date=loan.start_date, end_date=loan.due_date)

            payment = Payment(
                loan_id=loan.id,
                amount=round(total_amount, 2),
                payment_date=payment_date,
                payment_method=random.choice(list(PaymentMethodEnum)).value,
                transaction_id=str(uuid.uuid4()),
                created_at=datetime.combine(payment_date, datetime.min.time())
            )
            db.add(payment)
            payments.append(payment)

        # For active or overdue loans, create partial payments
        else:
            # Random number of payments (0-3)
            num_payments = random.randint(0, 3)

            for _ in range(num_payments):
                # Random payment amount (10-50% of principal)
                payment_percentage = random.uniform(0.1, 0.5)
                amount = round(loan.principal_amount * payment_percentage, 2)

                # Payment date between start date and now
                payment_date = fake.date_between(start_date=loan.start_date, end_date=datetime.now().date())

                payment = Payment(
                    loan_id=loan.id,
                    amount=amount,
                    payment_date=payment_date,
                    payment_method=random.choice(list(PaymentMethodEnum)).value,
                    transaction_id=str(uuid.uuid4()),
                    created_at=datetime.combine(payment_date, datetime.min.time())
                )
                db.add(payment)
                payments.append(payment)

    db.commit()
    return payments

def create_transactions(db: Session, num_transactions: int, customers: list, items: list, branches: list) -> list:
    """Create sample transactions (sales, purchases, etc.)"""
    transactions = []

    # Get sold items
    sold_items = [item for item in items if item.status == 'SOLD']

    # If we don't have enough sold items, update some available items to sold
    if len(sold_items) < num_transactions // 2:
        available_items = [item for item in items if item.status == 'AVAILABLE']
        num_to_convert = min(num_transactions // 2 - len(sold_items), len(available_items))

        for i in range(num_to_convert):
            available_items[i].status = 'SOLD'
            sold_items.append(available_items[i])

        db.commit()

    # Create sales transactions
    for item in sold_items:
        customer = random.choice(customers)
        branch = random.choice(branches)

        # Sale amount is typically 100-150% of appraised value
        sale_percentage = random.uniform(1.0, 1.5)
        amount = round(float(item.appraised_value) * sale_percentage, 2)

        # Transaction date in the past year
        transaction_date = fake.date_time_between(start_date="-1y", end_date="now")

        transaction = Transaction(
            transaction_number=f"T{fake.bothify(text='######')}",
            transaction_date=transaction_date,
            transaction_type=TransactionType.SALE.value,
            amount=amount,
            payment_method=random.choice(list(PaymentMethodEnum)).value,
            status=TransactionStatusEnum.COMPLETED.value,
            customer_id=customer.id,
            item_id=item.id,
            branch_id=branch.id,
            created_at=transaction_date
        )
        db.add(transaction)
        transactions.append(transaction)

    # Create other types of transactions
    remaining_transactions = num_transactions - len(sold_items)

    for _ in range(remaining_transactions):
        customer = random.choice(customers)
        branch = random.choice(branches)

        # Random transaction type (excluding SALE which we already handled)
        transaction_type = random.choice([
            TransactionType.PURCHASE.value,
            TransactionType.FEE.value,
            TransactionType.REFUND.value
        ])

        # Amount based on transaction type
        if transaction_type == TransactionType.PURCHASE.value:
            amount = round(random.uniform(50, 2000), 2)
        elif transaction_type == TransactionType.FEE.value:
            amount = round(random.uniform(10, 100), 2)
        else:  # REFUND
            amount = round(random.uniform(20, 500), 2)

        # Transaction date in the past year
        transaction_date = fake.date_time_between(start_date="-1y", end_date="now")

        transaction = Transaction(
            transaction_number=f"T{fake.bothify(text='######')}",
            transaction_date=transaction_date,
            transaction_type=transaction_type,
            amount=amount,
            payment_method=random.choice(list(PaymentMethodEnum)).value,
            status=TransactionStatusEnum.COMPLETED.value,
            customer_id=customer.id,
            item_id=None,
            branch_id=branch.id,
            created_at=transaction_date
        )
        db.add(transaction)
        transactions.append(transaction)

    db.commit()
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

    # Get database connection
    engine = create_engine(os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost/pawnshop"))
    SessionLocal = Session(bind=engine)
    db = SessionLocal()

    try:
        print("Starting sample data generation...")

        if args.clear:
            print("Clearing existing data...")
            # Clear tables in reverse order of dependencies
            db.query(Payment).delete()
            db.query(Transaction).delete()
            db.query(Loan).delete()
            db.query(Item).delete()
            db.query(Customer).delete()
            db.query(Employee).delete()
            db.query(Branch).delete()
            db.commit()
            print("Existing data cleared.")

        # Create branches
        print(f"Generating {args.branches} branches...")
        branches = create_branches(db, args.branches)
        print(f"Created {len(branches)} branches.")

        # Create employees
        print(f"Generating {args.employees} employees...")
        employees = create_employees(db, args.employees, branches)
        print(f"Created {len(employees)} employees.")

        # Create customers
        print(f"Generating {args.customers} customers...")
        customers = create_customers(db, args.customers)
        print(f"Created {len(customers)} customers.")

        # Create items
        print(f"Generating {args.items} items...")
        items = create_items(db, args.items, branches)
        print(f"Created {len(items)} items.")

        # Create loans
        print(f"Generating {args.loans} loans...")
        loans = create_loans(db, args.loans, customers, items, branches)
        print(f"Created {len(loans)} loans.")

        # Create payments
        print("Generating payments for loans...")
        payments = create_payments(db, loans)
        print(f"Created {len(payments)} payments.")

        # Create transactions
        print(f"Generating {args.transactions} transactions...")
        transactions = create_transactions(db, args.transactions, customers, items, branches)
        print(f"Created {len(transactions)} transactions.")

        print("Sample data generation complete!")

    except SQLAlchemyError as e:
        db.rollback()
        print(f"Error generating sample data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
