import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { NotificationService } from '../../core/services/notification.service';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="product-page-container">
      <!-- Breadcrumb / Back button -->
      <div class="breadcrumb-bar">
        <button mat-button routerLink="/products" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
          <span>Back to Supermarket Products</span>
        </button>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading()">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading product details...</p>
      </div>

      <!-- Product Not Found -->
      <div class="not-found-state" *ngIf="!isLoading() && !product()">
        <mat-icon>search_off</mat-icon>
        <h2>Product Not Found</h2>
        <p>The product you are looking for does not exist or has been discontinued.</p>
        <a mat-flat-button color="primary" routerLink="/products">Explore Other Products</a>
      </div>

      <!-- Product Details Card -->
      <mat-card class="product-card" *ngIf="!isLoading() && product()">
        <div class="product-layout">
          <!-- Left: Product Image -->
          <div class="image-section">
            <div class="image-wrapper">
              <img 
                [src]="product()?.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'" 
                [alt]="product()?.name" 
              />
              <span class="category-chip">{{ product()?.category_name }}</span>
              
              <div class="stock-badge low" *ngIf="product()!.is_low_stock && product()!.stock_quantity > 0">
                Only {{ product()?.stock_quantity }} left!
              </div>
              <div class="stock-badge out" *ngIf="product()!.stock_quantity === 0">
                Out of Stock
              </div>
            </div>
          </div>

          <!-- Right: Product Info & Actions -->
          <div class="info-section">
            <div class="title-row">
              <div>
                <h1 class="product-name">{{ product()?.name }}</h1>
                <div class="sku-tag">SKU: {{ product()?.sku }}</div>
              </div>

              <!-- Wishlist Button -->
              <button 
                mat-icon-button 
                class="wishlist-btn" 
                [class.in-wishlist]="isInWishlist()"
                (click)="toggleWishlist()"
                [matTooltip]="isInWishlist() ? 'Remove from Wishlist' : 'Add to Wishlist'">
                <mat-icon>{{ isInWishlist() ? 'favorite' : 'favorite_border' }}</mat-icon>
              </button>
            </div>

            <p class="description">
              {{ product()?.description || 'Fresh, top-grade supermarket selection carefully inspected to ensure premium quality for your household.' }}
            </p>

            <div class="meta-grid">
              <div class="meta-box">
                <span class="meta-label">Category</span>
                <span class="meta-val">{{ product()?.category_name }}</span>
              </div>
              <div class="meta-box">
                <span class="meta-label">Unit Packaging</span>
                <span class="meta-val">{{ product()?.unit }}</span>
              </div>
              <div class="meta-box">
                <span class="meta-label">Availability</span>
                <span class="meta-val status-in" *ngIf="product()!.stock_quantity > 0">
                  <mat-icon>check_circle</mat-icon> In Stock ({{ product()?.stock_quantity }} available)
                </span>
                <span class="meta-val status-out" *ngIf="product()!.stock_quantity === 0">
                  <mat-icon>cancel</mat-icon> Out of Stock
                </span>
              </div>
            </div>

            <!-- Pricing Box -->
            <div class="pricing-card">
              <div class="price-display">
                <span class="currency">$</span>
                <span class="amount">{{ product()?.price | number:'1.2-2' }}</span>
                <span class="unit">/ {{ product()?.unit }}</span>
              </div>

              <!-- Quantity Selector -->
              <div class="quantity-selector" *ngIf="product()!.stock_quantity > 0">
                <span class="qty-label">Quantity:</span>
                <div class="qty-stepper">
                  <button mat-icon-button (click)="decreaseQty()" [disabled]="quantity() <= 1">
                    <mat-icon>remove</mat-icon>
                  </button>
                  <span class="qty-value">{{ quantity() }}</span>
                  <button mat-icon-button (click)="increaseQty()" [disabled]="quantity() >= product()!.stock_quantity">
                    <mat-icon>add</mat-icon>
                  </button>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <button 
                mat-flat-button 
                color="primary" 
                class="add-cart-btn"
                [disabled]="product()!.stock_quantity === 0 || isAdding()"
                (click)="addToCart()">
                <mat-icon>add_shopping_cart</mat-icon>
                <span>Add {{ quantity() }} to Cart • \${{ ((product()?.price || 0) * quantity()) | number:'1.2-2' }}</span>
              </button>

              <button 
                mat-stroked-button 
                class="wishlist-action-btn"
                [class.active]="isInWishlist()"
                (click)="toggleWishlist()">
                <mat-icon>{{ isInWishlist() ? 'favorite' : 'favorite_border' }}</mat-icon>
                <span>{{ isInWishlist() ? 'In Wishlist' : 'Add to Wishlist' }}</span>
              </button>
            </div>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .product-page-container {
      max-width: 1100px;
      margin: 24px auto 48px;
      padding: 0 20px;
    }

    .breadcrumb-bar {
      margin-bottom: 16px;
      .back-btn {
        color: #0f766e;
        font-weight: 600;
        mat-icon { margin-right: 4px; }
      }
    }

    .loading-state, .not-found-state {
      text-align: center;
      padding: 64px 20px;
      mat-icon { font-size: 56px; width: 56px; height: 56px; color: #94a3b8; margin-bottom: 12px; }
      h2 { color: #0f172a; margin-bottom: 8px; }
      p { color: #64748b; margin-bottom: 24px; }
    }

    .product-card {
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      padding: 32px;
      background: #ffffff;
    }

    .product-layout {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 36px;

      @media (max-width: 820px) {
        grid-template-columns: 1fr;
      }
    }

    .image-wrapper {
      position: relative;
      border-radius: 14px;
      overflow: hidden;
      background: #f8fafc;
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e2e8f0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .category-chip {
        position: absolute;
        top: 14px;
        left: 14px;
        background: rgba(15, 118, 110, 0.9);
        color: #ffffff;
        font-size: 0.78rem;
        font-weight: 700;
        padding: 4px 12px;
        border-radius: 20px;
        backdrop-filter: blur(4px);
      }

      .stock-badge {
        position: absolute;
        bottom: 14px;
        left: 14px;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 700;

        &.low {
          background: #fef3c7;
          color: #92400e;
        }

        &.out {
          background: #fee2e2;
          color: #b91c1c;
        }
      }
    }

    .info-section {
      display: flex;
      flex-direction: column;

      .title-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;

        .product-name {
          font-size: 1.8rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px;
          line-height: 1.25;
        }

        .sku-tag {
          font-size: 0.82rem;
          color: #94a3b8;
          font-weight: 600;
        }

        .wishlist-btn {
          color: #94a3b8;
          &.in-wishlist {
            color: #ef4444;
          }
        }
      }

      .description {
        font-size: 0.95rem;
        color: #475569;
        line-height: 1.6;
        margin-bottom: 24px;
      }

      .meta-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
        margin-bottom: 24px;

        .meta-box {
          background: #f8fafc;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 2px;

          .meta-label {
            font-size: 0.75rem;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
          }

          .meta-val {
            font-size: 0.9rem;
            font-weight: 700;
            color: #1e293b;
            display: flex;
            align-items: center;
            gap: 4px;

            mat-icon { font-size: 16px; width: 16px; height: 16px; }

            &.status-in {
              color: #16a34a;
            }

            &.status-out {
              color: #dc2626;
            }
          }
        }
      }

      .pricing-card {
        background: #f0fdfa;
        border: 1px solid #ccfbf1;
        border-radius: 12px;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
        flex-wrap: wrap;
        gap: 16px;

        .price-display {
          display: flex;
          align-items: baseline;
          gap: 2px;

          .currency {
            font-size: 1.3rem;
            font-weight: 700;
            color: #0f766e;
          }

          .amount {
            font-size: 2.2rem;
            font-weight: 800;
            color: #0f766e;
            line-height: 1;
          }

          .unit {
            font-size: 0.95rem;
            color: #0d9488;
            margin-left: 4px;
            font-weight: 600;
          }
        }

        .quantity-selector {
          display: flex;
          align-items: center;
          gap: 12px;

          .qty-label {
            font-size: 0.85rem;
            font-weight: 600;
            color: #475569;
          }

          .qty-stepper {
            display: flex;
            align-items: center;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 8px;

            .qty-value {
              min-width: 32px;
              text-align: center;
              font-weight: 700;
              color: #0f172a;
            }
          }
        }
      }

      .action-buttons {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;

        .add-cart-btn {
          flex: 1;
          min-width: 220px;
          height: 48px;
          font-size: 1rem;
          font-weight: 700;
          border-radius: 10px;
          background: #0f766e !important;
          color: #ffffff !important;

          mat-icon { margin-right: 6px; }
        }

        .wishlist-action-btn {
          height: 48px;
          padding: 0 18px;
          font-weight: 600;
          border-radius: 10px;

          &.active {
            color: #ef4444;
            border-color: #fca5a5;
          }
        }
      }
    }
  `]
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private notification = inject(NotificationService);

  product = signal<Product | null>(null);
  isLoading = signal(true);
  quantity = signal(1);
  isAdding = signal(false);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const idStr = params.get('id');
      if (idStr) {
        const id = parseInt(idStr, 10);
        this.loadProduct(id);
      }
    });
  }

  loadProduct(id: number) {
    this.isLoading.set(true);
    this.productService.getProduct(id).subscribe({
      next: (prod) => {
        this.product.set(prod);
        this.isLoading.set(false);
      },
      error: () => {
        this.product.set(null);
        this.isLoading.set(false);
      }
    });
  }

  increaseQty() {
    const prod = this.product();
    if (prod && this.quantity() < prod.stock_quantity) {
      this.quantity.update((q) => q + 1);
    }
  }

  decreaseQty() {
    if (this.quantity() > 1) {
      this.quantity.update((q) => q - 1);
    }
  }

  isInWishlist(): boolean {
    const p = this.product();
    return p ? this.wishlistService.isInWishlist(p.id) : false;
  }

  toggleWishlist() {
    const p = this.product();
    if (p) {
      this.wishlistService.toggleWishlist(p);
    }
  }

  addToCart() {
    const p = this.product();
    if (!p || p.stock_quantity === 0) return;

    this.isAdding.set(true);
    this.cartService.addItem(p.id, this.quantity()).subscribe({
      next: () => {
        this.isAdding.set(false);
        this.notification.success(`Added ${this.quantity()} x "${p.name}" to cart!`);
      },
      error: () => {
        this.isAdding.set(false);
      }
    });
  }
}
