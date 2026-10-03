import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportService } from '../../core/services/report.service';
import { NotificationService } from '../../core/services/notification.service';
import { CustomerSummary } from '../../core/models/report.model';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="admin-page-container">
      <div class="admin-header">
        <div>
          <h1>Registered Customer Directory</h1>
          <p>Manage supermarket shoppers, account status, delivery destinations, and lifetime order histories.</p>
        </div>

        <button mat-stroked-button (click)="loadData()" [disabled]="isLoading()">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
      </div>

      <mat-card class="table-card">
        <div class="table-loading-bar" *ngIf="isLoading()">
          <mat-spinner diameter="36"></mat-spinner>
        </div>

        <table mat-table [dataSource]="reportService.customers()" class="modern-table">
          <!-- Name & Email -->
          <ng-container matColumnDef="customer">
            <th mat-header-cell *matHeaderCellDef>Shopper</th>
            <td mat-cell *matCellDef="let c">
              <div class="cust-info">
                <span class="c-name">{{ c.full_name }}</span>
                <span class="c-email">{{ c.email }}</span>
              </div>
            </td>
          </ng-container>

          <!-- Contact & Address -->
          <ng-container matColumnDef="contact">
            <th mat-header-cell *matHeaderCellDef>Phone & Default Address</th>
            <td mat-cell *matCellDef="let c">
              <div class="contact-info">
                <span class="c-phone">{{ c.phone || 'No phone recorded' }}</span>
                <span class="c-addr">{{ c.default_address || 'No saved default address' }}</span>
              </div>
            </td>
          </ng-container>

          <!-- Orders Count -->
          <ng-container matColumnDef="orders">
            <th mat-header-cell *matHeaderCellDef>Orders Placed</th>
            <td mat-cell *matCellDef="let c">
              <span class="order-chip">{{ c.orders_count }} orders</span>
            </td>
          </ng-container>

          <!-- Lifetime Spend -->
          <ng-container matColumnDef="spend">
            <th mat-header-cell *matHeaderCellDef>Lifetime Spend</th>
            <td mat-cell *matCellDef="let c">
              <span class="spend-val">\${{ c.total_spent | number:'1.2-2' }}</span>
            </td>
          </ng-container>

          <!-- Account Status -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Account Status</th>
            <td mat-cell *matCellDef="let c">
              <span class="status-chip" [class.active]="c.is_active" [class.inactive]="!c.is_active">
                <mat-icon>{{ c.is_active ? 'check_circle' : 'do_not_disturb_on' }}</mat-icon>
                {{ c.is_active ? 'Active' : 'Suspended' }}
              </span>
            </td>
          </ng-container>

          <!-- Joined Date -->
          <ng-container matColumnDef="joined">
            <th mat-header-cell *matHeaderCellDef>Member Since</th>
            <td mat-cell *matCellDef="let c">
              <span class="joined-date">{{ c.joined_at }}</span>
            </td>
          </ng-container>

          <!-- Actions -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="actions-header">Actions</th>
            <td mat-cell *matCellDef="let c" class="actions-cell">
              <button 
                mat-stroked-button 
                [color]="c.is_active ? 'warn' : 'primary'"
                (click)="toggleStatus(c)"
                [disabled]="processingId() === c.user_id"
                class="status-toggle-btn"
                [matTooltip]="c.is_active ? 'Suspend customer account' : 'Reactivate customer account'">
                <mat-icon>{{ c.is_active ? 'block' : 'check_circle' }}</mat-icon>
                <span>{{ c.is_active ? 'Suspend' : 'Activate' }}</span>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>

          <!-- Empty State -->
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell empty-table" [attr.colspan]="columns.length">
              <div class="empty-state">
                <mat-icon>people_outline</mat-icon>
                <h3>No registered customers yet</h3>
                <p>When customers register accounts on SmartMart, their profiles will appear here.</p>
              </div>
            </td>
          </tr>
        </table>
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
    .table-card {
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      position: relative;
      background: #ffffff;

      .table-loading-bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
      }

      .modern-table {
        width: 100%;
        th { 
          font-weight: 700; 
          color: #475569; 
          font-size: 0.85rem; 
          text-transform: uppercase; 
          background: #f8fafc; 
          padding: 16px 20px; 
          letter-spacing: 0.5px;
        }
        td { 
          padding: 16px 20px; 
          color: #1e293b; 
          border-bottom: 1px solid #f1f5f9; 
        }

        .cust-info { 
          display: flex; 
          flex-direction: column; 
          gap: 2px;
          .c-name { font-weight: 700; color: #0f172a; font-size: 0.95rem; } 
          .c-email { font-size: 0.82rem; color: #64748b; } 
        }

        .contact-info { 
          display: flex; 
          flex-direction: column; 
          gap: 2px;
          .c-phone { font-weight: 600; font-size: 0.85rem; color: #334155; } 
          .c-addr { font-size: 0.8rem; color: #64748b; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } 
        }

        .order-chip { 
          background: #f0fdfa; 
          color: #0f766e; 
          font-weight: 700; 
          font-size: 0.82rem; 
          padding: 4px 12px; 
          border-radius: 12px; 
          border: 1px solid #ccfbf1;
          display: inline-block;
        }

        .spend-val { 
          font-size: 1.05rem; 
          font-weight: 800; 
          color: #0f766e; 
        }

        .status-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 700;

          mat-icon { font-size: 16px; width: 16px; height: 16px; }

          &.active {
            background: #dcfce7;
            color: #15803d;
          }

          &.inactive {
            background: #fee2e2;
            color: #b91c1c;
          }
        }

        .joined-date { 
          font-size: 0.85rem; 
          color: #64748b; 
        }

        .actions-header {
          text-align: right;
        }

        .actions-cell {
          text-align: right;
        }

        .status-toggle-btn {
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.82rem;
          mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; }
        }

        .empty-state {
          padding: 48px;
          text-align: center;
          mat-icon { font-size: 48px; width: 48px; height: 48px; color: #94a3b8; margin-bottom: 8px; }
          h3 { font-size: 1.1rem; color: #334155; margin-bottom: 4px; }
          p { color: #64748b; font-size: 0.9rem; }
        }
      }
    }
  `]
})
export class AdminCustomersComponent implements OnInit {
  reportService = inject(ReportService);
  notification = inject(NotificationService);

  columns = ['customer', 'contact', 'orders', 'spend', 'status', 'joined', 'actions'];
  isLoading = signal(false);
  processingId = signal<number | null>(null);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.reportService.loadCustomers().subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false)
    });
  }

  toggleStatus(customer: CustomerSummary) {
    const nextStatus = !customer.is_active;
    const actionLabel = nextStatus ? 'activate' : 'suspend';
    
    if (!confirm(`Are you sure you want to ${actionLabel} account for ${customer.full_name}?`)) {
      return;
    }

    this.processingId.set(customer.user_id);
    this.reportService.updateCustomerStatus(customer.user_id, nextStatus).subscribe({
      next: () => {
        this.processingId.set(null);
        this.notification.success(`Customer ${customer.full_name} account ${nextStatus ? 'activated' : 'suspended'}.`);
      },
      error: (err) => {
        this.processingId.set(null);
        this.notification.error(err?.error?.detail || `Failed to update customer status`);
      }
    });
  }
}
