import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="cart-page-container">
      <div class="cart-header">
        <h1>Shopping Basket</h1>
        <p *ngIf="cartService.itemCount() > 0">
          Review your items, update quantities, or proceed to express checkout.
        </p>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="cartService.isLoading() && !cartService.cart()">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <!-- Active Cart Layout -->
      <div class="cart-layout" *ngIf="cartService.itemCount() > 0">
        <!-- Cart Items List -->
        <div class="items-column">
          <mat-card class="items-card">
            <div class="items-header">
              <h2>Aisle Items ({{ cartService.itemCount() }})</h2>
              <button mat-button color="warn" (click)="cartService.clearCart().subscribe()" class="clear-btn">
                <mat-icon>delete_sweep</mat-icon> Clear All
              </button>
            </div>

            <div class="items-list">
              <div *ngFor="let item of cartService.items()" class="cart-item-row">
                <img [src]="item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80'" class="item-thumb" [alt]="item.product_name" />

                <div class="item-info">
                  <h3 class="item-name">{{ item.product_name }}</h3>
                  <span class="item-sku">SKU: {{ item.product_sku }}</span>
                  <span class="item-price">\${{ item.unit_price | number:'1.2-2' }} / {{ item.unit }}</span>
                </div>

                <div class="quantity-controls">
                  <button mat-icon-button (click)="decreaseQty(item)" [disabled]="item.quantity <= 1">
                    <mat-icon>remove</mat-icon>
                  </button>
                  <span class="qty-display">{{ item.quantity }}</span>
                  <button mat-icon-button (click)="increaseQty(item)" [disabled]="item.quantity >= item.stock_available">
                    <mat-icon>add</mat-icon>
                  </button>
                </div>

                <div class="item-total">
                  <span class="total-price">\${{ item.total_price | number:'1.2-2' }}</span>
                </div>

                <button mat-icon-button color="warn" (click)="cartService.removeItem(item.id).subscribe()" class="remove-btn">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </div>
            </div>
          </mat-card>
        </div>

        <!-- Order Summary Sidebar -->
        <div class="summary-column">
          <mat-card class="summary-card">
            <!-- Free Delivery Progress -->
            <div class="free-shipping-card">
              <div class="shipping-msg" *ngIf="cartService.amountForFreeDelivery() > 0">
                <mat-icon>local_shipping</mat-icon>
                <span>Add <strong>\${{ cartService.amountForFreeDelivery() | number:'1.2-2' }}</strong> more for <strong>FREE Delivery!</strong></span>
              </div>
              <div class="shipping-msg free" *ngIf="cartService.amountForFreeDelivery() === 0">
                <mat-icon>check_circle</mat-icon>
                <span>You've unlocked <strong>FREE Home Delivery!</strong> 🎉</span>
              </div>
              <mat-progress-bar 
                mode="determinate" 
                [value]="((40 - cartService.amountForFreeDelivery()) / 40) * 100" 
                class="shipping-bar">
              </mat-progress-bar>
            </div>

            <h2>Order Summary</h2>
            <mat-divider></mat-divider>

            <div class="summary-rows">
              <div class="summary-row">
                <span>Subtotal ({{ cartService.itemCount() }} items)</span>
                <span class="val">\${{ cartService.subtotal() | number:'1.2-2' }}</span>
              </div>

              <div class="summary-row">
                <span>Estimated Tax (8%)</span>
                <span class="val">\${{ cartService.tax() | number:'1.2-2' }}</span>
              </div>

              <div class="summary-row">
                <span>Estimated Delivery</span>
                <span class="val" *ngIf="cartService.deliveryFee() > 0">\${{ cartService.deliveryFee() | number:'1.2-2' }}</span>
                <span class="val free-tag" *ngIf="cartService.deliveryFee() === 0">FREE</span>
              </div>

              <mat-divider></mat-divider>

              <div class="summary-row total-row">
                <span>Estimated Total</span>
                <span class="total-amount">\${{ cartService.total() | number:'1.2-2' }}</span>
              </div>
            </div>

            <button mat-flat-button color="primary" class="checkout-btn" routerLink="/checkout">
              <mat-icon>lock</mat-icon>
              <span>Proceed to Checkout</span>
            </button>

            <div class="trust-badges">
              <div class="badge-item">
                <mat-icon>verified_user</mat-icon>
                <span>Simulated Secure Payment</span>
              </div>
              <div class="badge-item">
                <mat-icon>eco</mat-icon>
                <span>Guaranteed Quality Freshness</span>
              </div>
            </div>
          </mat-card>
        </div>
      </div>

      <!-- Empty Cart State -->
      <div class="empty-cart-state" *ngIf="cartService.itemCount() === 0 && !cartService.isLoading()">
        <div class="empty-icon-wrap">
          <mat-icon>production_quantity_limits</mat-icon>
        </div>
        <h2>Your Shopping Basket is Empty</h2>
        <p>Explore our fresh produce, bakery, and grocery aisles to add items to your cart.</p>
        <button mat-flat-button color="primary" routerLink="/products" class="start-shopping-btn">
          <mat-icon>storefront</mat-icon>
          <span>Browse Supermarket Catalog</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .cart-page-container {
      max-width: 1300px;
      margin: 32px auto;
      padding: 0 20px;
    }

    .cart-header {
      margin-bottom: 24px;
      h1 { font-size: 1.8rem; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
      p { color: #64748b; font-size: 0.95rem; }
    }

    .cart-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 28px;

      @media (max-width: 950px) {
        grid-template-columns: 1fr;
      }
    }

    .items-card {
      padding: 24px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;

      .items-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f1f5f9;

        h2 { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0; }
        .clear-btn { font-size: 0.85rem; }
      }

      .items-list {
        display: flex;
        flex-direction: column;

        .cart-item-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid #f1f5f9;

          &:last-child {
            border-bottom: none;
          }

          .item-thumb {
            width: 72px;
            height: 72px;
            border-radius: 10px;
            object-fit: cover;
            background: #f1f5f9;
          }

          .item-info {
            flex: 1;
            display: flex;
            flex-direction: column;

            .item-name {
              font-size: 1rem;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 2px;
            }

            .item-sku {
              font-size: 0.75rem;
              color: #94a3b8;
              margin-bottom: 6px;
            }

            .item-price {
              font-size: 0.88rem;
              font-weight: 600;
              color: #0f766e;
            }
          }

          .quantity-controls {
            display: flex;
            align-items: center;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 2px;

            .qty-display {
              min-width: 28px;
              text-align: center;
              font-weight: 700;
              font-size: 0.95rem;
            }
          }

          .item-total {
            min-width: 80px;
            text-align: right;

            .total-price {
              font-size: 1.15rem;
              font-weight: 800;
              color: #0f172a;
            }
          }
        }
      }
    }

    .summary-card {
      padding: 24px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      position: sticky;
      top: 90px;

      .free-shipping-card {
        background: #f0fdfa;
        border: 1px dashed #5eead4;
        border-radius: 12px;
        padding: 14px;
        margin-bottom: 20px;

        .shipping-msg {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #0f766e;
          margin-bottom: 8px;

          mat-icon { font-size: 20px; width: 20px; height: 20px; }

          &.free {
            color: #047857;
          }
        }

        .shipping-bar {
          height: 6px;
          border-radius: 3px;
        }
      }

      h2 { font-size: 1.25rem; font-weight: 700; margin-bottom: 16px; }

      .summary-rows {
        margin: 16px 0 24px;
        display: flex;
        flex-direction: column;
        gap: 12px;

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.95rem;
          color: #475569;

          .val { font-weight: 600; color: #1e293b; }
          .free-tag { color: #10b981; font-weight: 700; }

          &.total-row {
            padding-top: 12px;
            font-size: 1.15rem;
            font-weight: 700;
            color: #0f172a;

            .total-amount {
              font-size: 1.45rem;
              font-weight: 800;
              color: #0f766e;
            }
          }
        }
      }

      .checkout-btn {
        width: 100%;
        height: 50px;
        font-size: 1.05rem;
        font-weight: 700;
        border-radius: 10px;
        background-color: #0f766e !important;
        color: #ffffff !important;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .trust-badges {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid #f1f5f9;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .badge-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: #64748b;

          mat-icon { font-size: 16px; width: 16px; height: 16px; color: #0f766e; }
        }
      }
    }

    .empty-cart-state {
      padding: 80px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;

      .empty-icon-wrap {
        width: 80px;
        height: 80px;
        background: #f1f5f9;
        color: #94a3b8;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;

        mat-icon { font-size: 40px; width: 40px; height: 40px; }
      }

      h2 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
      p { color: #64748b; max-width: 440px; margin-bottom: 24px; font-size: 0.95rem; }

      .start-shopping-btn {
        height: 48px;
        padding: 0 28px;
        font-weight: 600;
        border-radius: 10px;
        background-color: #0f766e !important;
        color: #ffffff !important;
      }
    }
  `]
})
export class CartComponent implements OnInit {
  cartService = inject(CartService);

  ngOnInit() {
    this.cartService.loadCart().subscribe();
  }

  increaseQty(item: any) {
    if (item.quantity < item.stock_available) {
      this.cartService.updateQuantity(item.id, item.quantity + 1).subscribe();
    }
  }

  decreaseQty(item: any) {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.id, item.quantity - 1).subscribe();
    }
  }
}
