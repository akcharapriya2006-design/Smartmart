import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryService } from '../../core/services/inventory.service';
import { StockLevel } from '../../core/models/inventory.model';

@Component({
  selector: 'app-restock-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="restock-dialog">
      <div class="dialog-header">
        <mat-icon class="restock-icon">add_business</mat-icon>
        <div>
          <h2>Restock Product Inventory</h2>
          <p>{{ data.name }} (SKU: {{ data.sku }})</p>
        </div>
      </div>

      <div class="current-stock-info">
        <div class="stat-box">
          <span class="lbl">Current Stock</span>
          <span class="num">{{ data.stock_quantity }} {{ data.unit }}</span>
        </div>
        <div class="stat-box">
          <span class="lbl">Alert Threshold</span>
          <span class="num">{{ data.low_stock_threshold }} {{ data.unit }}</span>
        </div>
      </div>

      <form [formGroup]="restockForm" (ngSubmit)="onSubmit()" class="restock-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Quantity to Add to Stock</mat-label>
          <input matInput type="number" formControlName="quantity" placeholder="e.g. 50" min="1" />
          <mat-icon matPrefix>inventory_2</mat-icon>
          <mat-error *ngIf="restockForm.get('quantity')?.hasError('required')">Quantity is required</mat-error>
          <mat-error *ngIf="restockForm.get('quantity')?.hasError('min')">Must add at least 1 unit</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Batch / Purchase Order Note</mat-label>
          <input matInput formControlName="note" placeholder="e.g. Supplier delivery batch #408" />
          <mat-icon matPrefix>description</mat-icon>
        </mat-form-field>

        <div class="dialog-actions">
          <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="restockForm.invalid">
            Confirm Restocking (+{{ restockForm.get('quantity')?.value || 0 }} {{ data.unit }})
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .restock-dialog {
      padding: 24px;
      max-width: 480px;

      .dialog-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 20px;

        .restock-icon {
          font-size: 36px;
          width: 36px;
          height: 36px;
          color: #0f766e;
          background: #f0fdfa;
          padding: 8px;
          border-radius: 12px;
        }

        h2 { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
        p { color: #64748b; font-size: 0.85rem; margin: 0; }
      }

      .current-stock-info {
        display: flex;
        gap: 12px;
        background: #f8fafc;
        border-radius: 10px;
        padding: 12px;
        margin-bottom: 20px;
        border: 1px solid #e2e8f0;

        .stat-box {
          flex: 1;
          display: flex;
          flex-direction: column;

          .lbl { font-size: 0.72rem; text-transform: uppercase; color: #64748b; }
          .num { font-size: 1.1rem; font-weight: 800; color: #0f172a; }
        }
      }

      .restock-form {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .full-width { width: 100%; }
      }

      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid #f1f5f9;

        button[color="primary"] {
          background-color: #0f766e !important;
          color: #ffffff !important;
        }
      }
    }
  `]
})
export class RestockDialogComponent {
  dialogRef = inject(MatDialogRef<RestockDialogComponent>);
  private fb = inject(FormBuilder);
  data: StockLevel = inject(MAT_DIALOG_DATA);

  restockForm: FormGroup = this.fb.group({
    quantity: [20, [Validators.required, Validators.min(1)]],
    note: ['Weekly fresh inventory replenishment batch']
  });

  onSubmit() {
    if (this.restockForm.invalid) return;
    this.dialogRef.close({
      product_id: this.data.product_id,
      quantity: this.restockForm.value.quantity,
      note: this.restockForm.value.note
    });
  }
}

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="admin-page-container">
      <div class="admin-header">
        <div>
          <h1>Inventory & Stock Replenishment</h1>
          <p>Real-time supermarket stock tracking, automated low-stock warnings, and transaction audit logs.</p>
        </div>

        <button mat-stroked-button (click)="refreshAll()">
          <mat-icon>refresh</mat-icon> Refresh Stock
        </button>
      </div>

      <!-- Low Stock Alert Banner -->
      <div class="alert-banner" *ngIf="inventoryService.alertSummary()?.total_low_stock_count as lowCount">
        <div class="alert-icon-box" [class.critical]="(inventoryService.alertSummary()?.critical_out_of_stock_count || 0) > 0">
          <mat-icon>warning</mat-icon>
        </div>
        <div class="alert-text-content">
          <h3>
            Low Stock Alert: {{ lowCount }} Products Below Replenishment Threshold
            <span *ngIf="inventoryService.alertSummary()?.critical_out_of_stock_count as outCount">
              ({{ outCount }} completely out of stock!)
            </span>
          </h3>
          <p>Restock these fast-moving grocery items now to prevent fulfillment delays.</p>
        </div>
      </div>

      <!-- Tabs: Stock Levels vs Audit Log -->
      <mat-card class="content-card">
        <mat-tab-group animationDuration="200ms">
          <!-- TAB 1: STOCK LEVELS -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">inventory_2</mat-icon>
              <span>Current Stock Levels ({{ inventoryService.stockLevels().length }})</span>
            </ng-template>

            <div class="tab-body">
              <table mat-table [dataSource]="inventoryService.stockLevels()" class="modern-table">
                <!-- Product -->
                <ng-container matColumnDef="product">
                  <th mat-header-cell *matHeaderCellDef>Product & SKU</th>
                  <td mat-cell *matCellDef="let s">
                    <div class="item-title-box">
                      <span class="p-title">{{ s.name }}</span>
                      <span class="p-sku">{{ s.sku }} • {{ s.category_name }}</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Stock Quantity -->
                <ng-container matColumnDef="stock">
                  <th mat-header-cell *matHeaderCellDef>Available Stock</th>
                  <td mat-cell *matCellDef="let s">
                    <div class="stock-display">
                      <span class="stock-qty-val">{{ s.stock_quantity }} {{ s.unit }}</span>
                      <span class="alert-pill low" *ngIf="s.is_low_stock && s.stock_quantity > 0">
                        &le; {{ s.low_stock_threshold }} threshold
                      </span>
                      <span class="alert-pill out" *ngIf="s.stock_quantity === 0">
                        Out of Stock
                      </span>
                    </div>
                  </td>
                </ng-container>

                <!-- Threshold -->
                <ng-container matColumnDef="threshold">
                  <th mat-header-cell *matHeaderCellDef>Alert Level</th>
                  <td mat-cell *matCellDef="let s">
                    <span class="threshold-pill">{{ s.low_stock_threshold }} {{ s.unit }}</span>
                  </td>
                </ng-container>

                <!-- Unit Price -->
                <ng-container matColumnDef="price">
                  <th mat-header-cell *matHeaderCellDef>Unit Price</th>
                  <td mat-cell *matCellDef="let s">
                    <span class="price-val">\${{ s.price | number:'1.2-2' }}</span>
                  </td>
                </ng-container>

                <!-- Action -->
                <ng-container matColumnDef="action">
                  <th mat-header-cell *matHeaderCellDef class="text-right">Action</th>
                  <td mat-cell *matCellDef="let s" class="text-right">
                    <button mat-flat-button color="primary" class="restock-btn" (click)="openRestockDialog(s)">
                      <mat-icon>add</mat-icon> Restock
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="stockColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: stockColumns;" [class.row-alert]="row.is_low_stock"></tr>
              </table>
            </div>
          </mat-tab>

          <!-- TAB 2: AUDIT LOG -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">history</mat-icon>
              <span>Stock Movement Audit Log ({{ inventoryService.transactions().length }})</span>
            </ng-template>

            <div class="tab-body">
              <table mat-table [dataSource]="inventoryService.transactions()" class="modern-table">
                <!-- Date -->
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>Timestamp</th>
                  <td mat-cell *matCellDef="let t">{{ t.created_at | date:'short' }}</td>
                </ng-container>

                <!-- Product -->
                <ng-container matColumnDef="product">
                  <th mat-header-cell *matHeaderCellDef>Product</th>
                  <td mat-cell *matCellDef="let t">
                    <span class="t-prod">{{ t.product_name }}</span>
                  </td>
                </ng-container>

                <!-- Type -->
                <ng-container matColumnDef="type">
                  <th mat-header-cell *matHeaderCellDef>Movement Type</th>
                  <td mat-cell *matCellDef="let t">
                    <span class="type-tag" [ngClass]="t.transaction_type.toLowerCase()">
                      {{ t.transaction_type }}
                    </span>
                  </td>
                </ng-container>

                <!-- Quantity Change -->
                <ng-container matColumnDef="change">
                  <th mat-header-cell *matHeaderCellDef>Change</th>
                  <td mat-cell *matCellDef="let t">
                    <span class="qty-change" [class.pos]="t.change_quantity > 0" [class.neg]="t.change_quantity < 0">
                      {{ t.change_quantity > 0 ? ('+' + t.change_quantity) : t.change_quantity }}
                    </span>
                  </td>
                </ng-container>

                <!-- Note & Ref -->
                <ng-container matColumnDef="note">
                  <th mat-header-cell *matHeaderCellDef>Reference & Notes</th>
                  <td mat-cell *matCellDef="let t">
                    <div class="ref-cell">
                      <code *ngIf="t.reference_id">{{ t.reference_id }}</code>
                      <span class="note-str">{{ t.note || '-' }}</span>
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="transColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: transColumns;"></tr>
              </table>
            </div>
          </mat-tab>
        </mat-tab-group>
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

    .alert-banner {
      display: flex;
      align-items: center;
      gap: 16px;
      background: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 24px;

      .alert-icon-box {
        width: 44px;
        height: 44px;
        background: #fde68a;
        color: #b45309;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;

        &.critical {
          background: #fee2e2;
          color: #b91c1c;
        }

        mat-icon { font-size: 24px; width: 24px; height: 24px; }
      }

      .alert-text-content {
        h3 { font-size: 1.05rem; font-weight: 800; color: #92400e; margin-bottom: 2px; }
        p { color: #78350f; font-size: 0.88rem; margin: 0; }
      }
    }

    .content-card {
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      overflow: hidden;

      .tab-icon { margin-right: 8px; font-size: 20px; width: 20px; height: 20px; }

      .tab-body {
        padding: 16px 0;
        overflow-x: auto;
      }
    }

    .modern-table {
      width: 100%;

      th {
        font-weight: 700; color: #475569; font-size: 0.85rem; text-transform: uppercase;
        background: #f8fafc; padding: 14px 16px;
      }

      td {
        padding: 12px 16px; color: #1e293b; border-bottom: 1px solid #f1f5f9;
      }

      .row-alert {
        background-color: #fffbeb;
      }

      .item-title-box {
        display: flex; flex-direction: column;
        .p-title { font-weight: 700; color: #0f172a; }
        .p-sku { font-size: 0.78rem; color: #64748b; }
      }

      .stock-display {
        display: flex; align-items: center; gap: 8px;
        .stock-qty-val { font-size: 1.05rem; font-weight: 800; color: #0f172a; }

        .alert-pill {
          font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 8px;
          &.low { background: #fef3c7; color: #b45309; }
          &.out { background: #fee2e2; color: #b91c1c; }
        }
      }

      .threshold-pill {
        background: #f1f5f9; padding: 4px 10px; border-radius: 10px; font-size: 0.82rem; font-weight: 600; color: #475569;
      }

      .price-val { font-weight: 700; color: #0f766e; }

      .restock-btn {
        background-color: #0f766e !important;
        color: #ffffff !important;
        font-size: 0.82rem;
        height: 36px;
        border-radius: 8px;
      }

      .type-tag {
        font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 8px; text-transform: uppercase;
        &.purchase_order { background: #dcfce7; color: #15803d; }
        &.sale { background: #e0f2fe; color: #0369a1; }
        &.manual_adjustment { background: #f1f5f9; color: #475569; }
      }

      .qty-change {
        font-weight: 800; font-size: 1rem;
        &.pos { color: #15803d; }
        &.neg { color: #dc2626; }
      }

      .ref-cell {
        display: flex; flex-direction: column; gap: 2px;
        code { font-size: 0.75rem; background: #f1f5f9; padding: 2px 4px; border-radius: 4px; width: fit-content; }
        .note-str { font-size: 0.82rem; color: #64748b; }
      }

      .text-right { text-align: right; }
    }
  `]
})
export class AdminInventoryComponent implements OnInit {
  inventoryService = inject(InventoryService);
  private dialog = inject(MatDialog);

  stockColumns = ['product', 'stock', 'threshold', 'price', 'action'];
  transColumns = ['date', 'product', 'type', 'change', 'note'];

  ngOnInit() {
    this.refreshAll();
  }

  refreshAll() {
    this.inventoryService.loadStock().subscribe();
    this.inventoryService.loadAlerts().subscribe();
    this.inventoryService.loadTransactions().subscribe();
  }

  openRestockDialog(stock: StockLevel) {
    const dialogRef = this.dialog.open(RestockDialogComponent, {
      data: stock,
      width: '460px'
    });

    dialogRef.afterClosed().subscribe((req) => {
      if (req) {
        this.inventoryService.restock(req).subscribe();
      }
    });
  }
}
