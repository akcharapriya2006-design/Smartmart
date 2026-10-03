import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportService } from '../../core/services/report.service';
import { OrderService } from '../../core/services/order.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dashboard-page-container">
      <!-- Dashboard Header -->
      <div class="dashboard-header">
        <div>
          <h1>Supermarket Overview</h1>
          <p>Key business statistics for products, registered customers, orders, and gross sales.</p>
        </div>

        <div class="header-actions">
          <button mat-stroked-button (click)="refreshAll()">
            <mat-icon>refresh</mat-icon> Refresh
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-overlay" *ngIf="reportService.isLoading()">
        <mat-spinner diameter="44"></mat-spinner>
      </div>

      <!-- 4 Core KPI Statistics Cards -->
      <div class="kpi-grid">
        <!-- 1. Total Products -->
        <mat-card class="kpi-card products-card">
          <div class="kpi-icon-wrap">
            <mat-icon>inventory_2</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Total Products</span>
            <span class="kpi-val">{{ reportService.summary()?.total_products || 0 }}</span>
            <span class="kpi-sub">Active supermarket items</span>
          </div>
        </mat-card>

        <!-- 2. Total Customers -->
        <mat-card class="kpi-card customers-card">
          <div class="kpi-icon-wrap">
            <mat-icon>people</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Total Customers</span>
            <span class="kpi-val">{{ reportService.summary()?.total_customers || 0 }}</span>
            <span class="kpi-sub">Registered customer accounts</span>
          </div>
        </mat-card>

        <!-- 3. Total Orders -->
        <mat-card class="kpi-card orders-card">
          <div class="kpi-icon-wrap">
            <mat-icon>shopping_bag</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Total Orders</span>
            <span class="kpi-val">{{ reportService.summary()?.total_orders || 0 }}</span>
            <span class="kpi-sub">{{ reportService.summary()?.pending_orders_count || 0 }} fulfillment pending</span>
          </div>
        </mat-card>

        <!-- 4. Total Sales -->
        <mat-card class="kpi-card sales-card">
          <div class="kpi-icon-wrap">
            <mat-icon>payments</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Total Sales</span>
            <span class="kpi-val">\${{ (reportService.summary()?.total_revenue || 0) | number:'1.2-2' }}</span>
            <span class="kpi-sub">Gross revenue to date</span>
          </div>
        </mat-card>
      </div>

      <!-- Recent Orders Summary Section -->
      <div class="section-container">
        <mat-card class="recent-orders-card">
          <div class="section-header">
            <div>
              <h2>Recent Customer Orders</h2>
              <p>Latest supermarket orders placed through the online storefront.</p>
            </div>
            <a mat-button color="primary" routerLink="/admin/orders">
              <span>View All Orders</span>
              <mat-icon>arrow_forward</mat-icon>
            </a>
          </div>

          <div class="table-responsive" *ngIf="orderService.adminOrders().length > 0">
            <table class="recent-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let order of orderService.adminOrders().slice(0, 5)">
                  <td class="bold-text">{{ order.order_number }}</td>
                  <td>{{ order.customer_name }}</td>
                  <td>
                    <span class="type-badge">{{ order.order_type === 'STORE_PICKUP' ? 'Pickup' : 'Delivery' }}</span>
                  </td>
                  <td>{{ order.items.length }} items</td>
                  <td class="total-cell">\${{ order.total_amount | number:'1.2-2' }}</td>
                  <td>
                    <span class="status-chip" [ngClass]="order.status.toLowerCase()">
                      {{ order.status.replace('_', ' ') }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="empty-state" *ngIf="orderService.adminOrders().length === 0">
            <p>No orders recorded yet.</p>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page-container {
      max-width: 1400px;
      margin: 32px auto;
      padding: 0 24px;
      position: relative;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;

      h1 {
        font-size: 1.85rem;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 4px;
      }

      p {
        color: #64748b;
        font-size: 0.95rem;
      }
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 32px;

      @media (max-width: 1080px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 580px) {
        grid-template-columns: 1fr;
      }
    }

    .kpi-card {
      padding: 24px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 18px;
      background: #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
      }

      .kpi-icon-wrap {
        width: 56px;
        height: 56px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }
      }

      &.products-card .kpi-icon-wrap {
        background: #f0fdf4;
        color: #16a34a;
      }

      &.customers-card .kpi-icon-wrap {
        background: #eff6ff;
        color: #2563eb;
      }

      &.orders-card .kpi-icon-wrap {
        background: #faf5ff;
        color: #9333ea;
      }

      &.sales-card .kpi-icon-wrap {
        background: #f0fdfa;
        color: #0f766e;
      }

      .kpi-info {
        display: flex;
        flex-direction: column;

        .kpi-label {
          font-size: 0.82rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .kpi-val {
          font-size: 1.85rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.15;
        }

        .kpi-sub {
          font-size: 0.78rem;
          color: #94a3b8;
          margin-top: 4px;
        }
      }
    }

    .section-container {
      margin-top: 8px;
    }

    .recent-orders-card {
      padding: 24px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      background: #ffffff;

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 2px;
        }

        p {
          color: #64748b;
          font-size: 0.88rem;
          margin: 0;
        }
      }

      .table-responsive {
        overflow-x: auto;
      }

      .recent-table {
        width: 100%;
        border-collapse: collapse;

        th {
          font-size: 0.8rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          padding: 12px 16px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          text-align: left;
        }

        td {
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.9rem;
          color: #334155;
        }

        .bold-text {
          font-weight: 700;
          color: #0f172a;
        }

        .type-badge {
          background: #f1f5f9;
          color: #475569;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .total-cell {
          font-weight: 700;
          color: #0f766e;
        }

        .status-chip {
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;

          &.pending { background: #fef3c7; color: #92400e; }
          &.confirmed { background: #dbeafe; color: #1e40af; }
          &.processing { background: #e0e7ff; color: #3730a3; }
          &.completed, &.delivered { background: #dcfce7; color: #166534; }
          &.cancelled { background: #fee2e2; color: #991b1b; }
        }
      }

      .empty-state {
        text-align: center;
        padding: 32px;
        color: #94a3b8;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  reportService = inject(ReportService);
  orderService = inject(OrderService);

  ngOnInit() {
    this.refreshAll();
  }

  refreshAll() {
    this.reportService.loadDashboardSummary().subscribe();
    this.orderService.getAdminOrders().subscribe();
  }
}
