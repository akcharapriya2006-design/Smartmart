import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { Product, ProductFilterParams } from '../../core/models/product.model';
import { ProductDetailDialogComponent } from '../product-detail/product-detail-dialog.component';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="catalog-page">
      <!-- Supermarket Hero Banner -->
      <section class="hero-banner">
        <div class="hero-content">
          <div class="fresh-pill">
            <mat-icon>eco</mat-icon> Fresh Daily Supermarket
          </div>
          <h1>Quality Groceries & Farm Fresh Produce</h1>
          <p>Order fresh fruits, organic vegetables, dairy, artisan bakery, and household staples delivered right to your door or ready for express store pickup.</p>
          
          <div class="perks-row">
            <div class="perk-badge">
              <mat-icon>local_shipping</mat-icon> Fast Home Delivery
            </div>
            <div class="perk-badge">
              <mat-icon>store</mat-icon> Free In-Store Pickup
            </div>
            <div class="perk-badge">
              <mat-icon>verified</mat-icon> 100% Quality Freshness
            </div>
          </div>
        </div>
      </section>

      <div class="catalog-container">
        <!-- Search and Quick Filter Bar -->
        <div class="search-filter-section">
          <div class="search-input-wrap">
            <mat-icon class="search-icon">search</mat-icon>
            <input 
              type="text" 
              placeholder="Search apples, milk, artisan bread, pasta, SKU..." 
              [(ngModel)]="searchQuery" 
              (keyup.enter)="applyFilters()"
              (input)="onSearchInput()"
            />
            <button mat-icon-button *ngIf="searchQuery" (click)="clearSearch()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="controls-group">
            <mat-slide-toggle [(ngModel)]="inStockOnly" (change)="applyFilters()" color="primary">
              In Stock Only
            </mat-slide-toggle>

            <mat-form-field appearance="outline" class="sort-select">
              <mat-label>Sort By</mat-label>
              <mat-select [(ngModel)]="sortBy" (selectionChange)="applyFilters()">
                <mat-option value="name_asc">Name: A to Z</mat-option>
                <mat-option value="price_asc">Price: Low to High</mat-option>
                <mat-option value="price_desc">Price: High to Low</mat-option>
                <mat-option value="newest">Newest Arrivals</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <!-- Category Horizontal Filter Pills -->
        <div class="category-pills-wrap">
          <button 
            class="cat-pill" 
            [class.active]="selectedCategoryId() === null"
            (click)="selectCategory(null)">
            <mat-icon>apps</mat-icon>
            <span>All Aisles ({{ productService.totalProducts() }})</span>
          </button>

          <button 
            *ngFor="let cat of categoryService.categories()" 
            class="cat-pill" 
            [class.active]="selectedCategoryId() === cat.id"
            (click)="selectCategory(cat.id)">
            <span>{{ cat.name }}</span>
            <span class="count-tag" *ngIf="cat.product_count">({{ cat.product_count }})</span>
          </button>
        </div>

        <!-- Loading State -->
        <div class="loading-state" *ngIf="productService.isLoading()">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Loading fresh products from supermarket aisles...</p>
        </div>

        <!-- Products Grid -->
        <div class="products-grid" *ngIf="!productService.isLoading() && productService.products().length > 0">
          <div *ngFor="let product of productService.products()" class="product-card">
            <!-- Product Image -->
            <div class="card-img-wrap" (click)="openProductDetail(product)">
              <img [src]="product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'" [alt]="product.name" loading="lazy" />
              
              <span class="category-tag">{{ product.category_name }}</span>

              <button 
                mat-icon-button 
                class="card-fav-btn"
                [class.in-fav]="wishlistService.isInWishlist(product.id)"
                (click)="$event.stopPropagation(); wishlistService.toggleWishlist(product)"
                [matTooltip]="wishlistService.isInWishlist(product.id) ? 'Remove from Wishlist' : 'Save to Wishlist'">
                <mat-icon>{{ wishlistService.isInWishlist(product.id) ? 'favorite' : 'favorite_border' }}</mat-icon>
              </button>
              
              <div class="stock-badge low" *ngIf="product.is_low_stock && product.stock_quantity > 0">
                Only {{ product.stock_quantity }} left!
              </div>

              <div class="stock-badge out" *ngIf="product.stock_quantity === 0">
                Sold Out
              </div>
            </div>

            <!-- Card Content -->
            <div class="card-content">
              <h3 class="product-title" (click)="openProductDetail(product)" [title]="product.name">{{ product.name }}</h3>
              
              <p class="product-sku" [title]="'SKU: ' + product.sku">SKU: {{ product.sku }}</p>

              <p class="product-desc" [title]="product.description" *ngIf="product.description">
                {{ product.description }}
              </p>

              <div class="pricing-row">
                <div class="price-container">
                  <span class="currency">$</span>
                  <span class="main-price">{{ product.price | number:'1.2-2' }}</span>
                  <span class="unit-text">/ {{ product.unit }}</span>
                </div>

                <button 
                  mat-flat-button 
                  color="primary" 
                  class="add-btn" 
                  [disabled]="product.stock_quantity === 0"
                  (click)="quickAddToCart(product)">
                  <mat-icon>add_shopping_cart</mat-icon>
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="!productService.isLoading() && productService.products().length === 0">
          <div class="empty-icon-wrap">
            <mat-icon>search_off</mat-icon>
          </div>
          <h3>No products match your criteria</h3>
          <p>Try searching for different grocery terms or clear your active category filters.</p>
          <button mat-stroked-button color="primary" (click)="resetAllFilters()">
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .catalog-page {
      background-color: #f8fafc;
      min-height: calc(100vh - 70px);
      padding-bottom: 60px;
    }

    .hero-banner {
      background: linear-gradient(135deg, #064e3b 0%, #0f766e 50%, #115e59 100%);
      color: #ffffff;
      padding: 48px 24px;
      position: relative;
      overflow: hidden;

      &::after {
        content: '';
        position: absolute;
        right: -60px;
        bottom: -60px;
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, rgba(20, 184, 166, 0.25) 0%, transparent 70%);
        border-radius: 50%;
      }

      .hero-content {
        max-width: 1400px;
        margin: 0 auto;
        position: relative;
        z-index: 1;

        .fresh-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 14px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            color: #34d399;
          }
        }

        h1 {
          font-size: 2.3rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 12px;
          max-width: 750px;
          line-height: 1.2;

          @media (max-width: 768px) {
            font-size: 1.7rem;
          }
        }

        p {
          font-size: 1.05rem;
          color: #ccfbf1;
          max-width: 650px;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .perks-row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;

          .perk-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.1);
            padding: 8px 16px;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 600;

            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
              color: #5eead4;
            }
          }
        }
      }
    }

    .catalog-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px 20px;
    }

    .search-filter-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      background: #ffffff;
      padding: 16px 20px;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
      margin-bottom: 20px;

      @media (max-width: 850px) {
        flex-direction: column;
        align-items: stretch;
      }

      .search-input-wrap {
        display: flex;
        align-items: center;
        background: #f1f5f9;
        border-radius: 12px;
        padding: 4px 14px;
        flex: 1;

        .search-icon {
          color: #64748b;
          margin-right: 8px;
        }

        input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 0.95rem;
          font-family: inherit;
          color: #1e293b;

          &::placeholder {
            color: #94a3b8;
          }
        }
      }

      .controls-group {
        display: flex;
        align-items: center;
        gap: 16px;

        .sort-select {
          min-width: 170px;
          margin-bottom: -16px;
        }
      }
    }

    .category-pills-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 12px;
      margin-bottom: 24px;

      &::-webkit-scrollbar {
        height: 4px;
      }

      .cat-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 18px;
        border-radius: 30px;
        border: 1px solid #e2e8f0;
        background: #ffffff;
        color: #475569;
        font-size: 0.88rem;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s ease;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        .count-tag {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        &:hover {
          border-color: #0f766e;
          color: #0f766e;
          background: #f0fdfa;
        }

        &.active {
          background: #0f766e;
          color: #ffffff;
          border-color: #0f766e;

          .count-tag {
            color: #ccfbf1;
          }
        }
      }
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 22px;
    }

    .product-card {
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
      }

      .card-img-wrap {
        position: relative;
        height: 190px;
        background: #f1f5f9;
        cursor: pointer;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;

          &:hover {
            transform: scale(1.05);
          }
        }

        .category-tag {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(4px);
          font-size: 0.72rem;
          font-weight: 700;
          color: #0f766e;
          padding: 3px 8px;
          border-radius: 8px;
        }

        .card-fav-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(255, 255, 255, 0.9);
          color: #64748b;
          width: 32px;
          height: 32px;
          line-height: 32px;
          border-radius: 50%;
          transition: all 0.2s ease;
          z-index: 2;

          &:hover {
            background: #ffffff;
            color: #ef4444;
            transform: scale(1.1);
          }

          &.in-fav {
            color: #ef4444;
            background: #ffffff;
          }

          mat-icon { font-size: 18px; width: 18px; height: 18px; }
        }

        .stock-badge {
          position: absolute;
          bottom: 10px;
          right: 10px;
          padding: 3px 8px;
          border-radius: 8px;
          font-size: 0.72rem;
          font-weight: 700;

          &.low {
            background: #f59e0b;
            color: #ffffff;
          }

          &.out {
            background: #ef4444;
            color: #ffffff;
          }
        }
      }

      .card-content {
        padding: 16px;
        display: flex;
        flex-direction: column;
        flex: 1;

        .product-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
          line-height: 1.4;
          cursor: pointer;
          min-height: 44px;
          word-break: break-word;

          &:hover {
            color: #0f766e;
          }
        }

        .product-sku {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-bottom: 8px;
        }

        .product-desc {
          font-size: 0.8rem;
          color: #64748b;
          line-height: 1.45;
          margin-bottom: 14px;
          word-break: break-word;
        }

        .pricing-row {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;

          .price-container {
            display: flex;
            align-items: baseline;
            flex-wrap: wrap;
            gap: 2px;
            color: #0f766e;

            .currency {
              font-size: 0.9rem;
              font-weight: 700;
            }

            .main-price {
              font-size: 1.35rem;
              font-weight: 800;
              white-space: nowrap;
            }

            .unit-text {
              font-size: 0.8rem;
              color: #64748b;
              white-space: nowrap;
            }
          }

          .add-btn {
            height: 38px;
            border-radius: 8px;
            font-size: 0.88rem;
            font-weight: 600;
            background-color: #0f766e !important;
            color: #ffffff !important;
            padding: 0 14px;
            display: flex;
            align-items: center;
            gap: 4px;

            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
            }

            &:hover {
              background-color: #115e59 !important;
            }

            &:disabled {
              opacity: 0.5;
            }
          }
        }
      }
    }

    .loading-state, .empty-state {
      padding: 60px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      p {
        color: #64748b;
        margin-top: 16px;
      }
    }

    .empty-state {
      .empty-icon-wrap {
        width: 70px;
        height: 70px;
        background: #f1f5f9;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        margin-bottom: 16px;

        mat-icon {
          font-size: 36px;
          width: 36px;
          height: 36px;
        }
      }

      h3 {
        font-size: 1.25rem;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 8px;
      }

      p {
        color: #64748b;
        max-width: 400px;
        margin-bottom: 20px;
      }
    }
  `]
})
export class CatalogComponent implements OnInit {
  router = inject(Router);
  productService = inject(ProductService);
  categoryService = inject(CategoryService);
  cartService = inject(CartService);
  wishlistService = inject(WishlistService);
  private dialog = inject(MatDialog);
  private notification = inject(NotificationService);

  searchQuery = '';
  inStockOnly = false;
  sortBy = 'name_asc';
  selectedCategoryId = signal<number | null>(null);

  private searchDebounceTimer: any;

  ngOnInit() {
    this.categoryService.loadCategories().subscribe();
    this.applyFilters();
  }

  onSearchInput() {
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.applyFilters();
    }, 350);
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
  }

  selectCategory(categoryId: number | null) {
    this.selectedCategoryId.set(categoryId);
    this.applyFilters();
  }

  applyFilters() {
    const filters: ProductFilterParams = {
      search: this.searchQuery.trim() || undefined,
      category_id: this.selectedCategoryId() || undefined,
      in_stock_only: this.inStockOnly || undefined,
      sort_by: this.sortBy,
      page: 1,
      size: 40
    };
    this.productService.getProducts(filters).subscribe();
  }

  resetAllFilters() {
    this.searchQuery = '';
    this.inStockOnly = false;
    this.sortBy = 'name_asc';
    this.selectedCategoryId.set(null);
    this.applyFilters();
  }

  openProductDetail(product: Product) {
    this.router.navigate(['/products', product.id]);
  }

  quickAddToCart(product: Product) {
    this.onAddToCartConfirmed(product, 1);
  }

  private onAddToCartConfirmed(product: Product, quantity: number) {
    this.cartService.addItem(product.id, quantity).subscribe();
  }
}
