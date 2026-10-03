import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-product-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <div class="product-modal">
      <div class="modal-header">
        <span class="category-chip">{{ product.category_name }}</span>
        <button mat-icon-button (click)="dialogRef.close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-body">
        <div class="image-wrapper">
          <img [src]="product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'" [alt]="product.name" />
          <div class="low-stock-pill" *ngIf="product.is_low_stock && product.stock_quantity > 0">
            <mat-icon>warning</mat-icon> Only {{ product.stock_quantity }} left in stock!
          </div>
          <div class="out-stock-pill" *ngIf="product.stock_quantity === 0">
            Out of Stock
          </div>
        </div>

        <div class="details-content">
          <h2 class="product-title">{{ product.name }}</h2>
          <div class="sku-badge">SKU: {{ product.sku }}</div>

          <p class="product-description">
            {{ product.description || 'Premium quality supermarket selection, freshly sourced and inspected for absolute customer satisfaction.' }}
          </p>

          <div class="meta-row">
            <div class="meta-item">
              <span class="label">Unit Size</span>
              <span class="value">{{ product.unit }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Availability</span>
              <span class="value status-in" *ngIf="product.stock_quantity > 0">In Stock ({{ product.stock_quantity }} {{ product.unit }})</span>
              <span class="value status-out" *ngIf="product.stock_quantity === 0">Out of Stock</span>
            </div>
          </div>

          <div class="price-action-section">
            <div class="price-box">
              <span class="currency">$</span>
              <span class="amount">{{ product.price | number:'1.2-2' }}</span>
              <span class="per-unit">/ {{ product.unit }}</span>
            </div>

            <div class="quantity-selector" *ngIf="product.stock_quantity > 0">
              <button mat-icon-button (click)="decreaseQty()" [disabled]="quantity() <= 1">
                <mat-icon>remove</mat-icon>
              </button>
              <span class="qty-num">{{ quantity() }}</span>
              <button mat-icon-button (click)="increaseQty()" [disabled]="quantity() >= product.stock_quantity">
                <mat-icon>add</mat-icon>
              </button>
            </div>
          </div>

          <div class="footer-actions">
            <button mat-flat-button color="primary" class="add-cart-btn" (click)="addToCart()" [disabled]="product.stock_quantity === 0">
              <mat-icon>add_shopping_cart</mat-icon>
              <span>Add {{ quantity() }} to Cart • \${{ (product.price * quantity()) | number:'1.2-2' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-modal {
      padding: 16px 24px 24px;
      max-width: 700px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .category-chip {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #0f766e;
        background: #f0fdfa;
        padding: 4px 12px;
        border-radius: 12px;
      }
    }

    .modal-body {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 24px;

      @media (max-width: 650px) {
        grid-template-columns: 1fr;
      }
    }

    .image-wrapper {
      position: relative;
      border-radius: 14px;
      overflow: hidden;
      height: 280px;
      background: #f8fafc;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .low-stock-pill {
        position: absolute;
        bottom: 12px;
        left: 12px;
        background: rgba(245, 158, 11, 0.95);
        color: #ffffff;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 4px;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }

      .out-stock-pill {
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(239, 68, 68, 0.95);
        color: #ffffff;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 12px;
      }
    }

    .details-content {
      display: flex;
      flex-direction: column;

      .product-title {
        font-size: 1.45rem;
        font-weight: 700;
        color: #0f172a;
        line-height: 1.25;
        margin-bottom: 4px;
      }

      .sku-badge {
        font-size: 0.8rem;
        color: #64748b;
        margin-bottom: 14px;
      }

      .product-description {
        color: #475569;
        font-size: 0.92rem;
        line-height: 1.6;
        margin-bottom: 18px;
      }

      .meta-row {
        display: flex;
        gap: 20px;
        padding: 12px 14px;
        background: #f8fafc;
        border-radius: 10px;
        margin-bottom: 20px;

        .meta-item {
          display: flex;
          flex-direction: column;

          .label {
            font-size: 0.75rem;
            color: #64748b;
            text-transform: uppercase;
          }

          .value {
            font-size: 0.88rem;
            font-weight: 600;
            color: #1e293b;

            &.status-in {
              color: #0f766e;
            }

            &.status-out {
              color: #ef4444;
            }
          }
        }
      }

      .price-action-section {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;

        .price-box {
          display: flex;
          align-items: baseline;
          color: #0f766e;

          .currency {
            font-size: 1.1rem;
            font-weight: 700;
          }

          .amount {
            font-size: 1.8rem;
            font-weight: 800;
          }

          .per-unit {
            font-size: 0.85rem;
            color: #64748b;
            margin-left: 4px;
          }
        }

        .quantity-selector {
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 2px;

          .qty-num {
            font-size: 1rem;
            font-weight: 700;
            min-width: 24px;
            text-align: center;
          }
        }
      }

      .footer-actions {
        .add-cart-btn {
          width: 100%;
          height: 48px;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 10px;
          background-color: #0f766e !important;
          color: #ffffff !important;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
      }
    }
  `]
})
export class ProductDetailDialogComponent {
  product: Product = inject(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<ProductDetailDialogComponent>);

  quantity = signal(1);

  decreaseQty() {
    if (this.quantity() > 1) {
      this.quantity.update((q) => q - 1);
    }
  }

  increaseQty() {
    if (this.quantity() < this.product.stock_quantity) {
      this.quantity.update((q) => q + 1);
    }
  }

  addToCart() {
    this.dialogRef.close({
      action: 'ADD_TO_CART',
      product: this.product,
      quantity: this.quantity()
    });
  }
}
