import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.model';
import { OrderTrackerComponent } from './order-tracker.component';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    OrderTrackerComponent
  ],
  template: `
    <div class="orders-page-container">
      <div class="orders-header">
        <div>
          <h1>My Supermarket Orders</h1>
          <p>Track fulfillment status, delivery addresses, and itemized purchase receipts.</p>
        </div>

        <button mat-stroked-button (click)="orderService.getMyOrders().subscribe()">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="orderService.isLoading()">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <!-- Orders List -->
      <div class="orders-list" *ngIf="!orderService.isLoading() && orderService.orders().length > 0">
        <mat-card *ngFor="let order of orderService.orders(); trackBy: trackByOrderId" class="order-card">
          <div class="order-top-bar">
            <div class="order-identity">
              <span class="order-number">{{ order.order_number }}</span>
              <span class="order-date">{{ order.created_at | date:'medium' }}</span>
            </div>

            <div class="status-badges">
              <span class="type-pill" [class.pickup]="order.order_type === 'STORE_PICKUP'">
                <mat-icon>{{ order.order_type === 'STORE_PICKUP' ? 'store' : 'local_shipping' }}</mat-icon>
                {{ order.order_type === 'STORE_PICKUP' ? 'Express Pickup' : 'Home Delivery' }}
              </span>

              <span class="status-chip" [ngClass]="order.status.toLowerCase()">
                {{ order.status.replace('_', ' ') }}
              </span>

              <button
                mat-flat-button
                class="track-order-button"
                [class.active-tracking]="trackingOrderId === order.id"
                (click)="toggleTracking(order)"
                id="track-btn-{{ order.id }}"
              >
                <mat-icon>local_shipping</mat-icon>
                <span>{{ trackingOrderId === order.id ? 'Close Tracking' : 'Track Order' }}</span>
              </button>
            </div>
          </div>

          <div class="order-summary-row">
            <div class="summary-col">
              <span class="col-label">Destination / Window:</span>
              <span class="col-val" *ngIf="order.order_type === 'HOME_DELIVERY'">{{ order.delivery_address }}</span>
              <span class="col-val" *ngIf="order.order_type === 'STORE_PICKUP'">{{ order.pickup_time_slot }}</span>
            </div>

            <div class="summary-col">
              <span class="col-label">Payment:</span>
              <span class="col-val">{{ order.payment_method.replace('_', ' ') }} ({{ order.payment_status }})</span>
            </div>

            <div class="summary-col total-col">
              <span class="col-label">Total Amount:</span>
              <span class="total-val">\${{ order.total_amount | number:'1.2-2' }}</span>
            </div>
          </div>

          <!-- Customer Live Order Tracking Section -->
          <app-order-tracker
            *ngIf="trackingOrderId === order.id"
            [order]="order"
            (orderChange)="onOrderUpdated($event)"
          ></app-order-tracker>

          <mat-expansion-panel class="items-expansion">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>receipt</mat-icon> View Itemized Receipt ({{ order.items.length }} items)
              </mat-panel-title>
            </mat-expansion-panel-header>

            <div class="receipt-content">
              <!-- Itemized Products List -->
              <div class="receipt-items-list">
                <div *ngFor="let item of order.items" class="receipt-item-row">
                  <!-- [PRODUCT IMAGE] 72px thumbnail -->
                  <div class="product-image-container">
                    <img
                      [src]="item.image_url || item.product_image || defaultImageFallback"
                      [alt]="item.product_name"
                      class="product-receipt-img"
                      loading="lazy"
                      (error)="onItemImageError($event)"
                    />
                  </div>

                  <!-- Details Column: Product Name, SKU, Price, Qty, Total -->
                  <div class="product-details-col">
                    <div class="product-title-row">
                      <span class="product-name">{{ item.product_name }}</span>
                      <span class="product-line-total">\${{ item.total_price | number:'1.2-2' }}</span>
                    </div>

                    <div class="product-meta-row">
                      <span class="meta-item"><span class="meta-label">SKU:</span> {{ item.product_sku || item.sku }}</span>
                      <span class="meta-sep">•</span>
                      <span class="meta-item"><span class="meta-label">Price:</span> \${{ (item.unit_price || item.price) | number:'1.2-2' }}</span>
                      <span class="meta-sep">•</span>
                      <span class="meta-item"><span class="meta-label">Qty:</span> {{ item.quantity }}</span>
                      <span class="meta-sep">•</span>
                      <span class="meta-item total-item"><span class="meta-label">Total:</span> \${{ item.total_price | number:'1.2-2' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Receipt Financial Totals -->
              <div class="receipt-totals-box">
                <div class="rt-row">
                  <span>Subtotal:</span>
                  <span>\${{ order.subtotal | number:'1.2-2' }}</span>
                </div>
                <div class="rt-row">
                  <span>Sales Tax (8%):</span>
                  <span>\${{ order.tax | number:'1.2-2' }}</span>
                </div>
                <div class="rt-row">
                  <span>Delivery Fee:</span>
                  <span>{{ order.delivery_fee > 0 ? ('$' + (order.delivery_fee | number:'1.2-2')) : 'FREE' }}</span>
                </div>
                <div class="rt-row grand-total">
                  <span>Grand Total Paid:</span>
                  <span>\${{ order.total_amount | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>
          </mat-expansion-panel>
        </mat-card>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!orderService.isLoading() && orderService.orders().length === 0">
        <mat-icon class="empty-icon">receipt_long</mat-icon>
        <h2>No Orders Yet</h2>
        <p>You haven't placed any supermarket grocery orders yet.</p>
        <button mat-flat-button color="primary" routerLink="/products">
          Start Shopping
        </button>
      </div>
    </div>
  `,
  styles: [`
    .orders-page-container {
      max-width: 1100px;
      margin: 32px auto;
      padding: 0 20px;
    }

    .orders-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h1 { font-size: 1.8rem; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
      p { color: #64748b; font-size: 0.95rem; }
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .order-card {
      padding: 20px 24px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;

      .order-top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 14px;
        border-bottom: 1px solid #f1f5f9;
        margin-bottom: 14px;

        @media (max-width: 600px) {
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }

        .order-identity {
          display: flex;
          align-items: baseline;
          gap: 12px;

          .order-number {
            font-size: 1.15rem;
            font-weight: 800;
            color: #0f172a;
          }

          .order-date {
            font-size: 0.82rem;
            color: #64748b;
          }
        }

        .status-badges {
          display: flex;
          gap: 8px;

          .type-pill {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #f0fdfa;
            color: #0f766e;
            font-size: 0.75rem;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 12px;

            mat-icon { font-size: 14px; width: 14px; height: 14px; }

            &.pickup {
              background: #fef3c7;
              color: #b45309;
            }
          }

          .status-chip {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.4px;

            &.confirmed, &.completed, &.delivered {
              background: #dcfce7;
              color: #15803d;
            }
            &.pending, &.processing, &.preparing {
              background: #e0f2fe;
              color: #0369a1;
            }
            &.ready_for_pickup, &.out_for_delivery {
              background: #fef3c7;
              color: #b45309;
            }
            &.cancelled {
              background: #fee2e2;
              color: #b91c1c;
            }
          }

          .track-order-button {
            font-size: 0.78rem !important;
            font-weight: 700 !important;
            padding: 0 12px !important;
            height: 28px !important;
            line-height: 28px !important;
            border-radius: 14px !important;
            background-color: #0f766e !important;
            color: #ffffff !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            border: none;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
            transition: all 0.2s ease;

            mat-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
            }

            &:hover {
              background-color: #0d655e !important;
              box-shadow: 0 2px 4px rgba(15, 118, 110, 0.25);
            }

            &.active-tracking {
              background-color: #334155 !important;
            }
          }
        }
      }

      .order-summary-row {
        display: grid;
        grid-template-columns: 2fr 1.5fr 1fr;
        gap: 16px;
        margin-bottom: 16px;

        @media (max-width: 700px) {
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .summary-col {
          display: flex;
          flex-direction: column;

          .col-label { font-size: 0.75rem; text-transform: uppercase; color: #64748b; margin-bottom: 2px; }
          .col-val { font-size: 0.9rem; font-weight: 600; color: #334155; }

          &.total-col {
            text-align: right;
            @media (max-width: 700px) { text-align: left; }
            .total-val { font-size: 1.35rem; font-weight: 800; color: #0f766e; }
          }
        }
      }

      .items-expansion {
        box-shadow: none !important;
        border: 1px solid #f1f5f9;
        border-radius: 10px !important;

        mat-panel-title {
          font-size: 0.88rem;
          font-weight: 600;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 6px;
          mat-icon { font-size: 18px; width: 18px; height: 18px; color: #0f766e; }
        }

        .receipt-content {
          padding-top: 14px;
        }

        .receipt-items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .receipt-item-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          transition: background 0.2s ease;

          &:hover {
            background: #f1f5f9;
          }

          @media (max-width: 600px) {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .product-image-container {
            width: 72px;
            height: 72px;
            min-width: 72px;
            min-height: 72px;
            border-radius: 10px;
            overflow: hidden;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

            .product-receipt-img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              display: block;
            }
          }

          .product-details-col {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 0;
            width: 100%;

            .product-title-row {
              display: flex;
              justify-content: space-between;
              align-items: baseline;
              gap: 12px;

              .product-name {
                font-size: 1rem;
                font-weight: 700;
                color: #0f172a;
                line-height: 1.25;
              }

              .product-line-total {
                font-size: 1.1rem;
                font-weight: 800;
                color: #0f766e;
                white-space: nowrap;
              }
            }

            .product-meta-row {
              display: flex;
              flex-wrap: wrap;
              align-items: center;
              gap: 12px;
              font-size: 0.85rem;
              color: #475569;

              .meta-label {
                color: #64748b;
                font-weight: 500;
              }

              .meta-sep {
                color: #cbd5e1;
              }

              .total-item {
                font-weight: 700;
                color: #0f766e;
              }
            }
          }
        }

        .receipt-totals-box {
          max-width: 280px;
          margin-left: auto;
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 14px 18px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;

          .rt-row {
            display: flex;
            justify-content: space-between;
            font-size: 0.88rem;
            color: #64748b;

            &.grand-total {
              padding-top: 8px;
              border-top: 1px solid #e2e8f0;
              font-weight: 800;
              color: #0f766e;
              font-size: 1.1rem;
            }
          }
        }
      }
    }

    .empty-state {
      padding: 60px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;

      .empty-icon { font-size: 48px; width: 48px; height: 48px; color: #94a3b8; margin-bottom: 16px; }
      h2 { font-size: 1.4rem; font-weight: 700; margin-bottom: 6px; }
      p { color: #64748b; margin-bottom: 20px; }
      button { background-color: #0f766e !important; color: #ffffff !important; }
    }
  `]
})
export class OrderHistoryComponent implements OnInit {
  orderService = inject(OrderService);
  private route = inject(ActivatedRoute);

  trackingOrderId: number | null = null;
  readonly defaultImageFallback =
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

  ngOnInit() {
    this.orderService.getMyOrders().subscribe();

    const trackParam = this.route.snapshot.queryParams['track'];
    if (trackParam) {
      this.trackingOrderId = Number(trackParam);
    }
  }

  toggleTracking(order: Order) {
    if (this.trackingOrderId === order.id) {
      this.trackingOrderId = null;
    } else {
      this.trackingOrderId = order.id;
    }
  }

  trackByOrderId(index: number, order: Order): number {
    return order.id;
  }

  onOrderUpdated(updated: Order) {
    this.orderService.orders.update((list) =>
      list.map((o) => (o.id === updated.id ? updated : o))
    );
  }

  onItemImageError(event: Event) {
    const target = event.target as HTMLElement;
    target.style.display = 'none';
    const fallback = target.nextElementSibling as HTMLElement;
    if (fallback) {
      fallback.style.display = 'flex';
    }
  }
}
