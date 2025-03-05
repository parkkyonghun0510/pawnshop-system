from typing import Optional, List, Union, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime
from enum import Enum


class ItemStatusEnum(str, Enum):
    PAWNED = "pawned"
    REDEEMED = "redeemed"
    DEFAULTED = "defaulted"
    FOR_SALE = "for_sale"
    SOLD = "sold"
    DAMAGED = "damaged"
    LOST = "lost"


class ItemCategoryEnum(str, Enum):
    JEWELRY = "jewelry"
    ELECTRONICS = "electronics"
    MUSICAL_INSTRUMENTS = "musical_instruments"
    TOOLS = "tools"
    WATCHES = "watches"
    FIREARMS = "firearms"
    COLLECTIBLES = "collectibles"
    LUXURY_ITEMS = "luxury_items"
    OTHER = "other"


class ItemAttributeBase(BaseModel):
    """Base schema for item attributes"""
    name: str
    value: Union[str, int, float, bool]
    

class ItemAttributeCreate(ItemAttributeBase):
    """Schema for creating an item attribute"""
    pass


class ItemAttributeUpdate(BaseModel):
    """Schema for updating an item attribute"""
    name: Optional[str] = None
    value: Optional[Union[str, int, float, bool]] = None


class ItemAttribute(ItemAttributeBase):
    """Schema for item attribute response"""
    id: int
    item_id: int
    
    class Config:
        orm_mode = True


class ItemPhotoBase(BaseModel):
    """Base schema for item photos"""
    url: str
    is_primary: bool = False
    description: Optional[str] = None


class ItemPhotoCreate(ItemPhotoBase):
    """Schema for creating an item photo"""
    pass


class ItemPhotoUpdate(BaseModel):
    """Schema for updating an item photo"""
    url: Optional[str] = None
    is_primary: Optional[bool] = None
    description: Optional[str] = None


class ItemPhoto(ItemPhotoBase):
    """Schema for item photo response"""
    id: int
    item_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True


class ItemBase(BaseModel):
    """Base schema for items"""
    name: str
    description: Optional[str] = None
    category: ItemCategoryEnum
    status: ItemStatusEnum
    serial_number: Optional[str] = None
    appraisal_value: float
    selling_price: Optional[float] = None
    condition: Optional[str] = None
    notes: Optional[str] = None
    customer_id: Optional[int] = None
    branch_id: Optional[int] = None


class ItemCreate(ItemBase):
    """Schema for creating an item"""
    attributes: Optional[List[ItemAttributeCreate]] = None
    photos: Optional[List[ItemPhotoCreate]] = None


class ItemUpdate(BaseModel):
    """Schema for updating an item"""
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ItemCategoryEnum] = None
    status: Optional[ItemStatusEnum] = None
    serial_number: Optional[str] = None
    appraisal_value: Optional[float] = None
    selling_price: Optional[float] = None
    condition: Optional[str] = None
    notes: Optional[str] = None
    customer_id: Optional[int] = None
    branch_id: Optional[int] = None


class Item(ItemBase):
    """Schema for item response"""
    id: int
    item_code: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    attributes: Optional[List[ItemAttribute]] = []
    photos: Optional[List[ItemPhoto]] = []
    
    class Config:
        orm_mode = True


class ItemSearchParams(BaseModel):
    """Schema for item search parameters"""
    search_term: Optional[str] = Field(None, description="Search by name, description, serial number, or item code")
    category: Optional[ItemCategoryEnum] = None
    status: Optional[ItemStatusEnum] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    customer_id: Optional[int] = None
    branch_id: Optional[int] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None


class ItemStats(BaseModel):
    """Schema for item statistics"""
    total_items: int
    items_by_status: Dict[str, int]
    items_by_category: Dict[str, int]
    total_inventory_value: float
    avg_item_value: float
    items_added_this_month: int
    items_sold_this_month: int 