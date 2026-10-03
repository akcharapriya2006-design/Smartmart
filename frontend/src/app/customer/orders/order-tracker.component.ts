import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription, interval } from 'rxjs';
import { Order, OrderStatus } from '../../core/models/order.model';
import { OrderService } from '../../core/services/order.service';

export interface TrackerStep {
  name: string;
  state: 'completed' | 'current' | 'inactive';
  symbol: '✓' | '●' | '○';
}

@Component({
  selector: 'app-order-tracker',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="tracker-container" id="tracker-panel-{{ order.id }}">
      <div class="tracker-header">
        <div class="tracker-title-row">
          <span class="header-truck">🚚</span>
          <h3>Track Your Order</h3>
          <span class="live-pill" *ngIf="order.status !== 'CANCELLED'">
            <span class="live-dot"></span> Live Updates
          </span>
        </div>

        <div class="tracker-actions">
          <button
            mat-icon-button
            class="refresh-btn"
            (click)="refresh()"
            [disabled]="isRefreshing"
            matTooltip="Fetch Latest Status"
            id="refresh-tracker-{{ order.id }}"
          >
            <mat-icon [class.spinning]="isRefreshing">refresh</mat-icon>
          </button>
        </div>
      </div>

      <!-- Local Dummy Delivery Map / Route Illustration -->
      <div class="dummy-map-card" *ngIf="order.status !== 'CANCELLED'">
        <div class="map-top-bar">
          <div class="map-heading">
            <mat-icon class="map-route-icon">alt_route</mat-icon>
            <span class="map-heading-text">Delivery Route</span>
          </div>

          <div class="current-delivery-point" [ngClass]="order.status.toLowerCase()">
            <span class="point-badge-dot"></span>
            <span class="point-badge-label">Current Point:</span>
            <strong class="point-badge-value">{{ currentDeliveryPoint }}</strong>
          </div>
        </div>

        <!-- Visual Route Diagram: 🏪 SmartMart Store ───────── 🚚 ───────── 🏠 Customer -->
        <div class="route-track-stage">
          <div class="route-track-line-wrapper">
            <!-- Background base line -->
            <div class="route-line-base"></div>
            <!-- Dynamic active progress line -->
            <div class="route-line-fill" [style.width.%]="routeProgressPercent"></div>

            <!-- Store Marker (Left) -->
            <div class="route-marker store-marker">
              <div class="marker-circle store-circle">
                <span class="marker-emoji">🏪</span>
              </div>
              <div class="marker-text-box">
                <span class="marker-title">SmartMart Store</span>
                <span class="marker-subtitle">Origin Hub</span>
              </div>
            </div>

            <!-- Delivery Vehicle Marker (Dynamic Position along route) -->
            <div
              class="delivery-vehicle-marker"
              [style.left.%]="routeProgressPercent"
              [class.at-destination]="order.status === 'DELIVERED' || order.status === 'COMPLETED'"
            >
              <div class="vehicle-bubble" [title]="vehicleTooltip">
                <span class="vehicle-emoji">🚚</span>
              </div>
              <div class="vehicle-label-chip">
                <span>{{ vehicleStatusLabel }}</span>
              </div>
            </div>

            <!-- Customer / Destination Marker (Right) -->
            <div class="route-marker customer-marker">
              <div class="marker-circle customer-circle" [class.reached]="order.status === 'DELIVERED' || order.status === 'COMPLETED'">
                <span class="marker-emoji">🏠</span>
              </div>
              <div class="marker-text-box right-align">
                <span class="marker-title">Customer</span>
                <span class="marker-subtitle" [title]="destinationAddress">{{ destinationAddress }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Normal Progress Flow (when NOT cancelled) -->
      <div class="tracker-body" *ngIf="order.status !== 'CANCELLED'">
        <div class="steps-flow">
          <ng-container *ngFor="let step of steps; let i = index; let isLast = last">
            <div class="step-row" [ngClass]="step.state">
              <span class="step-label">{{ step.name }}</span>
              <span class="step-spacer"></span>
              <div class="step-symbol-wrap">
                <span class="symbol-char" [ngClass]="step.state">{{ step.symbol }}</span>
              </div>
            </div>

            <!-- Connector pipe between steps -->
            <div class="connector-row" *ngIf="!isLast">
              <span class="connector-spacer"></span>
              <div class="connector-char-wrap">
                <span class="connector-pipe" [class.completed]="isConnectorCompleted(i)">│</span>
              </div>
            </div>
          </ng-container>
        </div>

        <!-- Current Status Highlight Box -->
        <div class="current-status-box" [ngClass]="order.status.toLowerCase()">
          <span class="current-status-heading">Current Status:</span>
          <span class="current-status-text">{{ currentStatusText }}</span>
        </div>
      </div>

      <!-- Cancelled State (when CANCELLED) -->
      <div class="cancelled-state-box" *ngIf="order.status === 'CANCELLED'">
        <div class="cancelled-header">
          <mat-icon class="cancel-icon">cancel</mat-icon>
          <div class="cancel-text">
            <h4>Order Cancelled</h4>
            <p>This order has been cancelled and will not be delivered.</p>
          </div>
        </div>

        <div class="current-status-box cancelled">
          <span class="current-status-heading">Current Status:</span>
          <span class="current-status-text">❌ Order Cancelled</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tracker-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 22px 24px;
      margin: 16px 0;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05);
      animation: fadeIn 0.25s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .tracker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 14px;
      border-bottom: 1px solid #f1f5f9;
      margin-bottom: 18px;

      .tracker-title-row {
        display: flex;
        align-items: center;
        gap: 10px;

        .header-truck {
          font-size: 1.4rem;
        }

        h3 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.2px;
        }

        .live-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ecfdf5;
          color: #047857;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 12px;
          border: 1px solid #a7f3d0;

          .live-dot {
            width: 7px;
            height: 7px;
            background: #10b981;
            border-radius: 50%;
            animation: pulse-ring 1.8s infinite;
          }
        }
      }

      .tracker-actions {
        .refresh-btn {
          color: #64748b;
          &:hover { color: #0f766e; background: #f0fdfa; }
          .spinning { animation: spin 1s linear infinite; }
        }
      }
    }

    @keyframes pulse-ring {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
      70% { box-shadow: 0 0 0 5px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    /* Dummy Delivery Map Styles */
    .dummy-map-card {
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px 24px;
      margin-bottom: 22px;

      .map-top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 24px;

        .map-heading {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;

          .map-route-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            color: #0f766e;
          }
        }

        .current-delivery-point {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 0.82rem;

          .point-badge-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #0f766e;
          }

          .point-badge-label {
            color: #64748b;
            font-weight: 600;
          }

          .point-badge-value {
            color: #0f172a;
            font-weight: 800;
          }

          &.out_for_delivery {
            border-color: #fde68a;
            background: #fffbeb;
            .point-badge-dot { background: #d97706; }
            .point-badge-value { color: #b45309; }
          }

          &.delivered, &.completed {
            border-color: #bbf7d0;
            background: #f0fdf4;
            .point-badge-dot { background: #16a34a; }
            .point-badge-value { color: #15803d; }
          }

          &.preparing, &.processing {
            border-color: #bae6fd;
            background: #f0f9ff;
            .point-badge-dot { background: #0284c7; }
            .point-badge-value { color: #0369a1; }
          }
        }
      }

      .route-track-stage {
        padding: 16px 12px 10px;

        .route-track-line-wrapper {
          position: relative;
          height: 60px;
          display: flex;
          align-items: center;
          margin: 0 40px;

          @media (max-width: 600px) {
            margin: 0 20px;
          }

          .route-line-base {
            position: absolute;
            left: 0;
            right: 0;
            height: 6px;
            background: #cbd5e1;
            border-radius: 3px;
          }

          .route-line-fill {
            position: absolute;
            left: 0;
            height: 6px;
            background: linear-gradient(90deg, #0f766e, #10b981);
            border-radius: 3px;
            transition: width 0.4s ease;
          }

          .route-marker {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 2;

            .marker-circle {
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: #ffffff;
              border: 2px solid #0f766e;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
              transition: all 0.3s ease;

              .marker-emoji {
                font-size: 1.35rem;
                line-height: 1;
              }

              &.customer-circle.reached {
                border-color: #10b981;
                background: #ecfdf5;
                box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.25);
              }
            }

            .marker-text-box {
              position: absolute;
              top: 50px;
              display: flex;
              flex-direction: column;
              align-items: center;
              white-space: nowrap;

              .marker-title {
                font-size: 0.85rem;
                font-weight: 800;
                color: #0f172a;
              }

              .marker-subtitle {
                font-size: 0.72rem;
                font-weight: 600;
                color: #64748b;
                max-width: 140px;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              &.right-align {
                align-items: center;
              }
            }

            &.store-marker {
              left: 0;
              transform: translate(-50%, -50%);
            }

            &.customer-marker {
              right: 0;
              left: auto;
              transform: translate(50%, -50%);
            }
          }

          .delivery-vehicle-marker {
            position: absolute;
            top: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 3;
            transition: left 0.5s ease;

            .vehicle-bubble {
              width: 42px;
              height: 42px;
              border-radius: 50%;
              background: #0f766e;
              border: 3px solid #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 3px 8px rgba(15, 118, 110, 0.35);

              .vehicle-emoji {
                font-size: 1.25rem;
                line-height: 1;
              }
            }

            .vehicle-label-chip {
              position: absolute;
              bottom: 48px;
              white-space: nowrap;
              background: #0f172a;
              color: #ffffff;
              font-size: 0.7rem;
              font-weight: 700;
              padding: 2px 8px;
              border-radius: 6px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);

              &::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                border-width: 4px;
                border-style: solid;
                border-color: #0f172a transparent transparent transparent;
              }
            }

            &.at-destination .vehicle-bubble {
              background: #10b981;
              box-shadow: 0 3px 8px rgba(16, 185, 129, 0.4);
            }
          }
        }
      }
    }

    .tracker-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 16px;
    }

    .steps-flow {
      max-width: 320px;
      display: flex;
      flex-direction: column;

      .step-row {
        display: flex;
        align-items: center;
        min-height: 28px;

        .step-label {
          font-size: 0.95rem;
          font-weight: 600;
          color: #334155;
          transition: color 0.2s ease;
        }

        .step-spacer {
          flex: 1;
        }

        .step-symbol-wrap {
          width: 32px;
          display: flex;
          justify-content: center;
          align-items: center;

          .symbol-char {
            font-size: 1.15rem;
            font-weight: 700;
            line-height: 1;
            transition: all 0.2s ease;

            &.completed {
              color: #10b981;
              font-weight: 800;
            }

            &.current {
              color: #0f766e;
              font-size: 1.25rem;
              text-shadow: 0 0 8px rgba(15, 118, 110, 0.4);
            }

            &.inactive {
              color: #94a3b8;
              font-size: 1.2rem;
            }
          }
        }

        &.current .step-label {
          color: #0f172a;
          font-weight: 800;
        }

        &.completed .step-label {
          color: #0f766e;
        }

        &.inactive .step-label {
          color: #94a3b8;
        }
      }

      .connector-row {
        display: flex;
        align-items: center;
        height: 16px;

        .connector-spacer {
          flex: 1;
        }

        .connector-char-wrap {
          width: 32px;
          display: flex;
          justify-content: center;
          align-items: center;

          .connector-pipe {
            font-size: 1rem;
            line-height: 1;
            font-weight: 700;
            color: #cbd5e1;

            &.completed {
              color: #10b981;
            }
          }
        }
      }
    }

    .current-status-box {
      margin-top: 8px;
      padding: 12px 16px;
      border-radius: 10px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-width: 340px;

      .current-status-heading {
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        color: #64748b;
        letter-spacing: 0.4px;
      }

      .current-status-text {
        font-size: 1.15rem;
        font-weight: 800;
        color: #0f766e;
      }

      &.delivered, &.completed {
        background: #f0fdf4;
        border-color: #bbf7d0;
        .current-status-text { color: #15803d; }
      }

      &.out_for_delivery, &.ready_for_pickup {
        background: #fffbeb;
        border-color: #fde68a;
        .current-status-text { color: #b45309; }
      }

      &.preparing, &.processing {
        background: #f0f9ff;
        border-color: #bae6fd;
        .current-status-text { color: #0284c7; }
      }

      &.confirmed {
        background: #f0fdfa;
        border-color: #99f6e4;
        .current-status-text { color: #0f766e; }
      }

      &.pending {
        background: #f8fafc;
        border-color: #cbd5e1;
        .current-status-text { color: #475569; }
      }

      &.cancelled {
        background: #fef2f2;
        border-color: #fecaca;
        .current-status-text { color: #b91c1c; }
      }
    }

    .cancelled-state-box {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .cancelled-header {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 10px;
        padding: 14px 16px;

        .cancel-icon {
          color: #dc2626;
          font-size: 28px;
          width: 28px;
          height: 28px;
        }

        .cancel-text {
          h4 {
            margin: 0 0 2px 0;
            font-size: 1rem;
            font-weight: 700;
            color: #991b1b;
          }
          p {
            margin: 0;
            font-size: 0.85rem;
            color: #b91c1c;
          }
        }
      }
    }
  `]
})
export class OrderTrackerComponent implements OnInit, OnDestroy, OnChanges {
  @Input({ required: true }) order!: Order;
  @Output() orderChange = new EventEmitter<Order>();

  private orderService = inject(OrderService);
  private pollSub?: Subscription;

  isRefreshing = false;
  steps: TrackerStep[] = [];
  currentStatusText = '';

  // Dummy Map properties
  routeProgressPercent = 5;
  vehicleStatusLabel = 'Order Pending';
  currentDeliveryPoint = 'SmartMart Fulfillment Hub';

  get destinationAddress(): string {
    if (this.order.order_type === 'STORE_PICKUP') {
      return this.order.pickup_time_slot ? `Pickup: ${this.order.pickup_time_slot}` : 'Store Pickup';
    }
    return this.order.delivery_address || 'Customer Home';
  }

  get vehicleTooltip(): string {
    return `${this.vehicleStatusLabel} (${this.routeProgressPercent}% along route)`;
  }

  ngOnInit() {
    this.computeSteps();
    // Fetch latest status from backend
    this.refreshSilently();

    // Periodic live polling every 5 seconds without complexity
    this.pollSub = interval(5000).subscribe(() => {
      this.refreshSilently();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['order'] && !changes['order'].firstChange) {
      this.computeSteps();
    }
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  refresh() {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    this.orderService.getMyOrderDetail(this.order.id).subscribe({
      next: (latest) => {
        this.order = latest;
        this.computeSteps();
        this.orderChange.emit(latest);
        this.isRefreshing = false;
      },
      error: () => {
        this.isRefreshing = false;
      }
    });
  }

  private refreshSilently() {
    if (this.isRefreshing) return;
    this.orderService.getMyOrderDetail(this.order.id).subscribe({
      next: (latest) => {
        const hasChanged =
          this.order.status !== latest.status ||
          this.order.updated_at !== latest.updated_at;
        this.order = latest;
        this.computeSteps();
        if (hasChanged) {
          this.orderChange.emit(latest);
        }
      },
      error: () => {}
    });
  }

  computeSteps() {
    const s = this.order.status;

    // 1. Status Behavior:
    // If status = PENDING:
    // Pending = current
    if (s === 'PENDING') {
      this.currentStatusText = '⏳ Pending';
      this.routeProgressPercent = 5;
      this.vehicleStatusLabel = 'Pending';
      this.currentDeliveryPoint = 'SmartMart Fulfillment Hub';

      this.steps = [
        { name: 'Pending', state: 'current', symbol: '●' },
        { name: 'Order Confirmed', state: 'inactive', symbol: '○' },
        { name: 'Preparing', state: 'inactive', symbol: '○' },
        { name: 'Out for Delivery', state: 'inactive', symbol: '○' },
        { name: 'Delivered', state: 'inactive', symbol: '○' }
      ];
      return;
    }

    // If status = CONFIRMED:
    // Order Confirmed = current
    if (s === 'CONFIRMED') {
      this.currentStatusText = 'Order Confirmed';
      this.routeProgressPercent = 20;
      this.vehicleStatusLabel = 'Confirmed';
      this.currentDeliveryPoint = 'SmartMart Store Hub';

      this.steps = [
        { name: 'Order Confirmed', state: 'current', symbol: '●' },
        { name: 'Preparing', state: 'inactive', symbol: '○' },
        { name: 'Out for Delivery', state: 'inactive', symbol: '○' },
        { name: 'Delivered', state: 'inactive', symbol: '○' }
      ];
      return;
    }

    // If status = PREPARING:
    // Order Confirmed = completed ✓
    // Preparing = current ●
    if (s === 'PREPARING' || s === 'PROCESSING') {
      this.currentStatusText = 'Preparing';
      this.routeProgressPercent = 45;
      this.vehicleStatusLabel = 'Packing Items';
      this.currentDeliveryPoint = 'SmartMart Packing Bay';

      this.steps = [
        { name: 'Order Confirmed', state: 'completed', symbol: '✓' },
        { name: 'Preparing', state: 'current', symbol: '●' },
        { name: 'Out for Delivery', state: 'inactive', symbol: '○' },
        { name: 'Delivered', state: 'inactive', symbol: '○' }
      ];
      return;
    }

    // If status = OUT_FOR_DELIVERY:
    // Order Confirmed = completed ✓
    // Preparing = completed ✓
    // Out for Delivery = current ●
    // Current Status: 🚚 Out for Delivery
    if (s === 'OUT_FOR_DELIVERY' || s === 'READY_FOR_PICKUP') {
      this.currentStatusText = '🚚 Out for Delivery';
      this.routeProgressPercent = 75;
      this.vehicleStatusLabel = 'Out for Delivery';
      this.currentDeliveryPoint =
        this.order.order_type === 'STORE_PICKUP'
          ? 'Ready at Store Counter'
          : 'En Route to Delivery Address';

      this.steps = [
        { name: 'Order Confirmed', state: 'completed', symbol: '✓' },
        { name: 'Preparing', state: 'completed', symbol: '✓' },
        { name: 'Out for Delivery', state: 'current', symbol: '●' },
        { name: 'Delivered', state: 'inactive', symbol: '○' }
      ];
      return;
    }

    // If status = DELIVERED:
    // Order Confirmed = completed ✓
    // Preparing = completed ✓
    // Out for Delivery = completed ✓
    // Delivered = current ●
    // Current Status: ✅ Delivered
    if (s === 'DELIVERED' || s === 'COMPLETED') {
      this.currentStatusText = '✅ Delivered';
      this.routeProgressPercent = 96;
      this.vehicleStatusLabel = 'Delivered';
      this.currentDeliveryPoint =
        this.order.order_type === 'STORE_PICKUP'
          ? 'Customer Picked Up'
          : 'Customer Address (Delivered)';

      this.steps = [
        { name: 'Order Confirmed', state: 'completed', symbol: '✓' },
        { name: 'Preparing', state: 'completed', symbol: '✓' },
        { name: 'Out for Delivery', state: 'completed', symbol: '✓' },
        { name: 'Delivered', state: 'current', symbol: '●' }
      ];
      return;
    }

    // If status = CANCELLED:
    // Do not show normal delivery progress.
    // Show: ❌ Order Cancelled
    if (s === 'CANCELLED') {
      this.currentStatusText = '❌ Order Cancelled';
      this.routeProgressPercent = 0;
      this.vehicleStatusLabel = 'Cancelled';
      this.currentDeliveryPoint = 'Cancelled';
      this.steps = [];
      return;
    }

    // Fallback default
    this.currentStatusText = s;
    this.routeProgressPercent = 0;
    this.vehicleStatusLabel = s;
    this.currentDeliveryPoint = 'SmartMart Store';
    this.steps = [
      { name: 'Order Confirmed', state: 'inactive', symbol: '○' },
      { name: 'Preparing', state: 'inactive', symbol: '○' },
      { name: 'Out for Delivery', state: 'inactive', symbol: '○' },
      { name: 'Delivered', state: 'inactive', symbol: '○' }
    ];
  }

  isConnectorCompleted(stepIndex: number): boolean {
    if (stepIndex < 0 || stepIndex >= this.steps.length - 1) return false;
    return this.steps[stepIndex].state === 'completed';
  }
}
