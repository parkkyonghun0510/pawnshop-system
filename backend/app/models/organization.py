from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Float, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class EmployeeType(Base):
    __tablename__ = "employee_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    employees = relationship("Employee", back_populates="employee_type")


class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String)
    phone = Column(String)
    email = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    employees = relationship("Employee", foreign_keys="Employee.branch_id", back_populates="branch")
    inventory = relationship("Item", back_populates="branch")
    transactions = relationship("Transaction", back_populates="branch")
    applications = relationship("Application", back_populates="branch")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    branch_id = Column(Integer, ForeignKey("branches.id"))
    employee_type_id = Column(Integer, ForeignKey("employee_types.id"))
    hire_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="employee")
    branch = relationship("Branch", foreign_keys=[branch_id], back_populates="employees")
    employee_type = relationship("EmployeeType", back_populates="employees")
    
    # Transactions processed by this employee
    processed_transactions = relationship("Transaction", foreign_keys="Transaction.processed_by_id", back_populates="processed_by")
    
    # Items appraised by this employee
    appraised_items = relationship("Item", foreign_keys="Item.appraised_by_id", back_populates="appraised_by")
    
    # Applications processed by this employee
    processed_applications = relationship("Application", foreign_keys="Application.processed_by_id", back_populates="processed_by") 