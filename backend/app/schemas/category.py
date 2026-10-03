from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class CategoryOut(CategoryBase):
    id: int
    created_at: datetime
    product_count: Optional[int] = 0
    model_config = ConfigDict(from_attributes=True)
