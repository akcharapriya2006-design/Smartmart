from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import get_db, require_admin
from app.models.category import Category
from app.models.product import Product
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryOut

router = APIRouter()

@router.get("/", response_model=List[CategoryOut])
def get_categories(
    include_inactive: bool = False,
    db: Session = Depends(get_db)
) -> Any:
    """List all categories with live product count."""
    query = db.query(
        Category,
        func.count(Product.id).label("product_count")
    ).outerjoin(Product, (Product.category_id == Category.id) & (Product.is_active == True))

    if not include_inactive:
        query = query.filter(Category.is_active == True)

    query = query.group_by(Category.id).order_by(Category.name.asc())
    results = query.all()

    category_list = []
    for cat, count in results:
        cat_out = CategoryOut.model_validate(cat)
        cat_out.product_count = count
        category_list.append(cat_out)

    return category_list

@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    _admin = Depends(require_admin)
) -> Any:
    """Create a new supermarket department category (Admin only)."""
    existing = db.query(Category).filter(Category.name.ilike(category_in.name.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{category_in.name}' already exists"
        )
    
    category = Category(
        name=category_in.name.strip(),
        description=category_in.description.strip() if category_in.description else None,
        image_url=category_in.image_url.strip() if category_in.image_url else None,
        is_active=category_in.is_active
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    
    cat_out = CategoryOut.model_validate(category)
    cat_out.product_count = 0
    return cat_out

@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    category_in: CategoryUpdate,
    db: Session = Depends(get_db),
    _admin = Depends(require_admin)
) -> Any:
    """Update category details (Admin only)."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    if category_in.name is not None and category_in.name.strip() != category.name:
        existing = db.query(Category).filter(Category.name.ilike(category_in.name.strip())).first()
        if existing and existing.id != category_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Another category with this name already exists")
        category.name = category_in.name.strip()

    if category_in.description is not None:
        category.description = category_in.description.strip()
    if category_in.image_url is not None:
        category.image_url = category_in.image_url.strip()
    if category_in.is_active is not None:
        category.is_active = category_in.is_active

    db.add(category)
    db.commit()
    db.refresh(category)

    count = db.query(Product).filter(Product.category_id == category.id, Product.is_active == True).count()
    cat_out = CategoryOut.model_validate(category)
    cat_out.product_count = count
    return cat_out

@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _admin = Depends(require_admin)
) -> Any:
    """Soft-delete / deactivate category (Admin only)."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    # Toggle active status or soft delete
    category.is_active = not category.is_active
    db.add(category)
    db.commit()
    return {"message": f"Category '{category.name}' status updated to {'Active' if category.is_active else 'Inactive'}"}
