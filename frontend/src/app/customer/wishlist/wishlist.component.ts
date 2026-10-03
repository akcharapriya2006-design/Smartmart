import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="wishlist-page-container">
      <div class="wishlist-header">
        <div>
          <h1>My Saved Wishlist</h1>
          <p>Keep track of grocery favorites, seasonal specials, and items to purchase later.</p>
        </div>

        <button 
          mat-stroked-button 
          color="warn" 
          *ngIf="wishlistService.items().length > 0"
          (click)="wishlistService.clearWishlist()">
          <mat-icon>delete_sweep</mat-icon> Clear All
        </button>
      </div>

      <!-- Empty State -->
      <div class="empty-wishlist" *ngIf="wishlistService.items().length === 0">
        <div class="empty-icon-wrap">
          <mat-icon>favorite_border</mat-icon>
        </div>
        <h2>Your wishlist is currently empty</h2>
        <p>Save fresh produce, pantry staples, and bakery goods by clicking the heart icon on any product.</p>
        <a mat-flat-button color="primary" routerLink="/products" class="browse-btn">
          <mat-icon>shopping_basket</mat-icon> Browse Supermarket Catalog
        </a>
      </div>

      <!-- Wishlist Grid -->
      <div class="wishlist-grid" *ngIf="wishlistService.items().length > 0">
        <mat-card *ngFor="let product of wishlistService.items()" class="wishlist-item-card">
          <div class="card-image-wrap" [routerLink]="['/products', product.id]">
            <img [src]="product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'" [alt]="product.name" />
            <span class="category-badge">{{ product.category_name }}</span>
            <button 
              mat-icon-button 
              class="remove-fav-btn" 
              (click)="$event.stopPropagation(); wishlistService.removeFromWishlist(product.id)"
              matTooltip="Remove from Wishlist">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="card-body">
            <h3 class="product-title" [routerLink]="['/products', product.id]">{{ product.name }}</h3>
            <span class="product-sku">SKU: {{ product.sku }}</span>

            <div class="availability-row">
              <span class="stock-status" [class.in]="product.stock_quantity > 0" [class.out]="product.stock_quantity === 0">
                <mat-icon>{{ product.stock_quantity > 0 ? 'check_circle' : 'cancel' }}</mat-icon>
                {{ product.stock_quantity > 0 ? 'In Stock (' + product.stock_quantity + ' ' + product.unit + ')' : 'Out of Stock' }}
              </span>
            </div>

            <div class="card-footer">
              <div class="price-box">
                <span class="currency">$</span>
                <span class="amount">{{ product.price | number:'1.2-2' }}</span>
                <span class="unit">/ {{ product.unit }}</span>
              </div>

              <button 
                mat-flat-button 
                color="primary" 
                class="move-cart-btn"
                [disabled]="product.stock_quantity === 0"
                (click)="moveToCart(product)">
                <mat-icon>add_shopping_cart</mat-icon>
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .wishlist-page-container {
      max-width: 1200px;
      margin: 32px auto 64px;
      padding: 0 24px;
    }

    .wishlist-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;

      h1 {
        font-size: 1.8rem;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 4px;
      }

      p {
        color: #64748b;
        font-size: 0.95rem;
      }
    }

    .empty-wishlist {
      text-align: center;
      padding: 72px 24px;
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;

      .empty-icon-wrap {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: #fef2f2;
        color: #ef4444;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;

        mat-icon { font-size: 40px; width: 40px; height: 40px; }
      }

      h2 { font-size: 1.35rem; color: #0f172a; margin-bottom: 8px; }
      p { color: #64748b; max-width: 480px; margin: 0 auto 24px; line-height: 1.5; }
      .browse-btn {
        background: #0f766e !important;
        color: #ffffff !important;
        font-weight: 600;
        border-radius: 8px;
        padding: 0 24px;
        height: 44px;
      }
    }

    .wishlist-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .wishlist-item-card {
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      background: #ffffff;
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      }

      .card-image-wrap {
        position: relative;
        aspect-ratio: 4/3;
        background: #f8fafc;
        cursor: pointer;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .category-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(15, 118, 110, 0.9);
          color: #ffffff;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: 12px;
        }

        .remove-fav-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(255, 255, 255, 0.9);
          color: #64748b;
          width: 32px;
          height: 32px;
          line-height: 32px;
          &:hover {
            color: #ef4444;
            background: #ffffff;
          }
          mat-icon { font-size: 18px; width: 18px; height: 18px; }
        }
      }

      .card-body {
        padding: 16px;
        display: flex;
        flex-direction: column;

        .product-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2px;
          cursor: pointer;
          &:hover { color: #0f766e; }
        }

        .product-sku {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-bottom: 8px;
        }

        .availability-row {
          margin-bottom: 12px;
          .stock-status {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 0.78rem;
            font-weight: 600;
            mat-icon { font-size: 14px; width: 14px; height: 14px; }
            &.in { color: #16a34a; }
            &.out { color: #dc2626; }
          }
        }

        .card-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;

          .price-box {
            .currency { font-weight: 700; color: #0f766e; }
            .amount { font-size: 1.25rem; font-weight: 800; color: #0f766e; }
            .unit { font-size: 0.8rem; color: #64748b; }
          }

          .move-cart-btn {
            background: #0f766e !important;
            color: #ffffff !important;
            font-size: 0.82rem;
            font-weight: 600;
            border-radius: 8px;
            mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; }
          }
        }
      }
    }
  `]
})
export class WishlistComponent {
  wishlistService = inject(WishlistService);
  private cartService = inject(CartService);
  private notification = inject(NotificationService);

  moveToCart(product: Product) {
    this.cartService.addItem(product.id, 1).subscribe({
      next: () => {
        this.wishlistService.removeFromWishlist(product.id);
        this.notification.success(`Moved "${product.name}" to cart!`);
      }
    });
  }
}
