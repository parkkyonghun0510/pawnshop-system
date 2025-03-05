from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Float, Enum, Text, Numeric, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime

from app.database import Base


class ItemStatus(enum.Enum):
    PAWNED = "pawned"
    REDEEMED = "redeemed"
    DEFAULTED = "defaulted"
    FOR_SALE = "for_sale"
    SOLD = "sold"
    DAMAGED = "damaged"
    LOST = "lost"


class ItemCategory(enum.Enum):
    JEWELRY = "jewelry"
    ELECTRONICS = "electronics"
    MUSICAL_INSTRUMENTS = "musical_instruments"
    TOOLS = "tools"
    WATCHES = "watches"
    FIREARMS = "firearms"
    COLLECTIBLES = "collectibles"
    LUXURY_ITEMS = "luxury_items"
    OTHER = "other"


class TransactionType(enum.Enum):
    PAWN = "pawn"
    REDEMPTION = "redemption"
    SALE = "sale"
    PAYMENT = "payment"
    EXTENSION = "extension"
    REFUND = "refund"
    ADJUSTMENT = "adjustment"


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_code = Column(String, unique=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, index=True)
    phone = Column(String)
    address = Column(String)
    city = Column(String)
    state = Column(String)
    country = Column(String)
    zip_code = Column(String)
    id_type = Column(String)  # e.g., drivers license, passport
    id_number = Column(String)
    id_expiry = Column(Date)
    date_of_birth = Column(Date)
    is_active = Column(Boolean, default=True)
    credit_score = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    loans = relationship("Loan", back_populates="customer")
    transactions = relationship("Transaction", back_populates="customer")
    applications = relationship("Application", back_populates="customer")


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    category = Column(Enum(ItemCategory))
    branch_id = Column(Integer, ForeignKey("branches.id"))
    status = Column(Enum(ItemStatus), default=ItemStatus.PAWNED)
    condition = Column(String)
    serial_number = Column(String, nullable=True)
    appraised_value = Column(Numeric(10, 2))
    loan_value = Column(Numeric(10, 2))
    sale_price = Column(Numeric(10, 2), nullable=True)
    acquisition_date = Column(DateTime(timezone=True))
    redemption_deadline = Column(DateTime(timezone=True), nullable=True)
    sold_date = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    storage_location = Column(String, nullable=True)
    images = Column(String, nullable=True)  # Comma-separated URLs or JSON
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    branch = relationship("Branch", back_populates="inventory")
    loan = relationship("Loan", back_populates="item", uselist=False)
    
    # Appraiser reference
    appraised_by_id = Column(Integer, ForeignKey("employees.id"))
    appraised_by = relationship("Employee", foreign_keys=[appraised_by_id], back_populates="appraised_items")
    
    # Application reference
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    application = relationship("Application", back_populates="items")


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    loan_number = Column(String, unique=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    item_id = Column(Integer, ForeignKey("items.id"))
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    principal_amount = Column(Numeric(10, 2))
    interest_rate = Column(Float)  # Monthly interest rate as a percentage
    term_days = Column(Integer)    # Loan duration in days
    start_date = Column(DateTime(timezone=True))
    due_date = Column(DateTime(timezone=True))
    extended_due_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String)  # active, paid, defaulted, extended
    actual_end_date = Column(DateTime(timezone=True), nullable=True)
    total_paid = Column(Numeric(10, 2), default=0)
    remaining_balance = Column(Numeric(10, 2))
    extension_count = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    customer = relationship("Customer", back_populates="loans")
    item = relationship("Item", back_populates="loan")
    payments = relationship("Payment", back_populates="loan")
    application = relationship("Application", back_populates="loan")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_number = Column(String, unique=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"))
    amount = Column(Numeric(10, 2))
    payment_date = Column(DateTime(timezone=True))
    payment_method = Column(String)  # cash, credit card, bank transfer
    reference_number = Column(String, nullable=True)  # e.g., receipt number
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    loan = relationship("Loan", back_populates="payments")
    transaction = relationship("Transaction", back_populates="payment", uselist=False)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_number = Column(String, unique=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    processed_by_id = Column(Integer, ForeignKey("employees.id"))
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    transaction_type = Column(Enum(TransactionType))
    amount = Column(Numeric(10, 2))
    transaction_date = Column(DateTime(timezone=True))
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    branch = relationship("Branch", back_populates="transactions")
    customer = relationship("Customer", back_populates="transactions")
    processed_by = relationship("Employee", foreign_keys=[processed_by_id], back_populates="processed_transactions")
    payment = relationship("Payment", back_populates="transaction")


class ApplicationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    application_number = Column(String, unique=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    item_category = Column(Enum(ItemCategory), nullable=False)
    item_description = Column(Text, nullable=False)
    estimated_value = Column(Float, nullable=False)
    loan_amount = Column(Float, nullable=False)
    interest_rate = Column(Float, nullable=False)
    term_months = Column(Integer, nullable=False)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.PENDING, nullable=False)
    notes = Column(Text)
    processed_by_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    processed_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="applications")
    branch = relationship("Branch", back_populates="applications")
    processed_by = relationship("Employee", foreign_keys=[processed_by_id], back_populates="processed_applications")
    loan = relationship("Loan", back_populates="application", uselist=False)
    items = relationship("Item", back_populates="application") 