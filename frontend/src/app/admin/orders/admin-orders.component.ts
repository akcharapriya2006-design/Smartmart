import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../core/services/order.service';
import { Order, OrderStatus } from '../../core/models/order.model';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="admin-page-container">
      <div class="admin-header">
        <div>
          <h1>Supermarket Order Fulfillment</h1>
          <p>Monitor incoming customer orders, manage delivery dispatches and in-store pickups.</p>
        </div>

        <button mat-stroked-button (click)="loadOrders()" class="refresh-btn">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
      </div>

      <!-- Filters -->
      <mat-card class="filter-card">
        <div class="filter-row">
          <div class="search-box">
            <mat-icon>search</mat-icon>
            <input 
              type="text" 
              placeholder="Search by Order #, Customer Name or Email..." 
              [(ngModel)]="search" 
              (keyup.enter)="loadOrders()" 
            />
            <button mat-icon-button *ngIf="search" (click)="search = ''; loadOrders()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <mat-form-field appearance="outline" class="status-select">
            <mat-label>Fulfillment Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="loadOrders()">
              <mat-option [value]="null">All Statuses</mat-option>
              <mat-option value="PENDING">PENDING</mat-option>
              <mat-option value="CONFIRMED">CONFIRMED</mat-option>
              <mat-option value="PREPARING">PREPARING</mat-option>
              <mat-option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</mat-option>
              <mat-option value="DELIVERED">DELIVERED</mat-option>
              <mat-option value="CANCELLED">CANCELLED</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      <!-- Orders Table -->
      <mat-card class="table-card">
        <div class="loading-overlay" *ngIf="orderService.isLoading()">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <div class="table-responsive">
          <table mat-table [dataSource]="orderService.adminOrders()" class="modern-table">
            <!-- Order Number & Date -->
            <ng-container matColumnDef="order_info">
              <th mat-header-cell *matHeaderCellDef>Order ID</th>
              <td mat-cell *matCellDef="let o">
                <div class="cell-stack">
                  <span class="ord-num">{{ o.order_number }}</span>
                  <span class="ord-time">{{ o.created_at | date:'short' }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Customer -->
            <ng-container matColumnDef="customer">
              <th mat-header-cell *matHeaderCellDef>Customer</th>
              <td mat-cell *matCellDef="let o">
                <div class="cell-stack">
                  <span class="c-name">{{ o.customer_name }}</span>
                  <span class="c-email">{{ o.customer_email }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Mode & Destination -->
            <ng-container matColumnDef="fulfillment">
              <th mat-header-cell *matHeaderCellDef>Fulfillment</th>
              <td mat-cell *matCellDef="let o">
                <div class="cell-stack">
                  <span class="mode-tag" [class.pickup]="o.order_type === 'STORE_PICKUP'">
                    {{ o.order_type === 'STORE_PICKUP' ? 'Express Pickup' : 'Home Delivery' }}
                  </span>
                  <span class="loc-text" *ngIf="o.order_type === 'HOME_DELIVERY'" [title]="o.delivery_address">{{ o.delivery_address }}</span>
                  <span class="loc-text" *ngIf="o.order_type === 'STORE_PICKUP'" [title]="o.pickup_time_slot">{{ o.pickup_time_slot }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Total Amount -->
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Total</th>
              <td mat-cell *matCellDef="let o">
                <div class="cell-stack">
                  <span class="amount-bold">\${{ o.total_amount | number:'1.2-2' }}</span>
                  <span class="item-count">{{ o.items.length }} items</span>
                </div>
              </td>
            </ng-container>

            <!-- Payment -->
            <ng-container matColumnDef="payment">
              <th mat-header-cell *matHeaderCellDef>Payment</th>
              <td mat-cell *matCellDef="let o">
                <div class="cell-stack">
                  <span class="pay-method">{{ o.payment_method.replace('_', ' ') }}</span>
                  <span class="pay-stat" [class.paid]="o.payment_status === 'PAID'">
                    {{ o.payment_status }}
                  </span>
                </div>
              </td>
            </ng-container>

            <!-- Status Workflow Action -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Update Status</th>
              <td mat-cell *matCellDef="let o">
                <mat-form-field appearance="outline" class="inline-status-select" [ngClass]="o.status.toLowerCase()">
                  <mat-select [ngModel]="o.status" (ngModelChange)="onStatusChange(o, $event)">
                    <mat-option value="PENDING">PENDING</mat-option>
                    <mat-option value="CONFIRMED">CONFIRMED</mat-option>
                    <mat-option value="PREPARING">PREPARING</mat-option>
                    <mat-option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</mat-option>
                    <mat-option value="DELIVERED">DELIVERED</mat-option>
                    <mat-option value="CANCELLED">CANCELLED</mat-option>
                  </mat-select>
                </mat-form-field>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .admin-page-container {
      max-width: 1400px;
      margin: 32px auto;
      padding: 0 24px;
    }

    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h1 { font-size: 1.7rem; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
      p { color: #64748b; font-size: 0.95rem; }
    }

    .filter-card {
      padding: 16px 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin-bottom: 20px;

      .filter-row {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;

        .search-box {
          display: flex;
          align-items: center;
          background: #f1f5f9;
          border-radius: 10px;
          padding: 2px 12px;
          flex: 2;
          min-width: 250px;

          mat-icon { color: #64748b; margin-right: 6px; }
          input { border: none; background: transparent; outline: none; width: 100%; font-size: 0.95rem; color: #1e293b; }
        }

        .status-select {
          flex: 1;
          min-width: 180px;
          margin-bottom: -16px;
        }
      }
    }

    .table-card {
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      position: relative;

      .loading-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(255, 255, 255, 0.7);
        display: flex; align-items: center; justify-content: center;
        z-index: 5;
      }

      .table-responsive { overflow-x: auto; }

      .modern-table {
        width: 100%;

        th {
          font-weight: 700; color: #475569; font-size: 0.85rem; text-transform: uppercase;
          background: #f8fafc; padding: 14px 16px;
        }

        td {
          padding: 12px 16px; color: #1e293b; border-bottom: 1px solid #f1f5f9;
        }

        .cell-stack {
          display: flex; flex-direction: column; gap: 2px;
        }

        .ord-num { font-weight: 800; color: #0f172a; font-size: 0.95rem; }
        .ord-time { font-size: 0.78rem; color: #94a3b8; }

        .c-name { font-weight: 700; color: #1e293b; }
        .c-email { font-size: 0.78rem; color: #64748b; }

        .mode-tag {
          font-size: 0.75rem; font-weight: 700; color: #0f766e;
          background: #f0fdfa; padding: 2px 8px; border-radius: 8px; width: fit-content;

          &.pickup { background: #fef3c7; color: #b45309; }
        }

        .loc-text { font-size: 0.8rem; color: #64748b; max-width: 280px; line-height: 1.35; word-break: break-word; }

        .amount-bold { font-size: 1.1rem; font-weight: 800; color: #0f766e; }
        .item-count { font-size: 0.78rem; color: #94a3b8; }

        .pay-method { font-size: 0.82rem; font-weight: 600; color: #334155; }
        .pay-stat {
          font-size: 0.72rem; font-weight: 700; color: #64748b;
          &.paid { color: #15803d; }
        }

        .inline-status-select {
          min-width: 170px;
          margin-bottom: -16px;
        }
      }
    }
  `]
})
export class AdminOrdersComponent implements OnInit {
  orderService = inject(OrderService);

  columns = ['order_info', 'customer', 'fulfillment', 'amount', 'payment', 'status'];

  search = '';
  statusFilter: OrderStatus | null = null;

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.getAdminOrders(this.statusFilter || undefined, this.search || undefined).subscribe();
  }

  onStatusChange(order: Order, newStatus: OrderStatus) {
    this.orderService.updateOrderStatus(order.id, newStatus).subscribe();
  }
}
