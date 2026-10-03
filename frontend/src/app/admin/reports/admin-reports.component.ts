import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Chart, registerables } from 'chart.js';
import { ReportService } from '../../core/services/report.service';
import { OrderService } from '../../core/services/order.service';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="reports-page-container">
      <!-- Page Header -->
      <div class="reports-header">
        <div>
          <h1>Supermarket Sales & Operations Analytics</h1>
          <p>Examine revenue growth, department performance, product velocity, and order fulfillment statistics.</p>
        </div>

        <div class="range-selector-wrap">
          <mat-button-toggle-group [(ngModel)]="selectedDays" (change)="onRangeChange()" class="range-toggle">
            <mat-button-toggle [value]="7">7 Days (Daily)</mat-button-toggle>
            <mat-button-toggle [value]="14">14 Days (Bi-Weekly)</mat-button-toggle>
            <mat-button-toggle [value]="30">30 Days (Monthly)</mat-button-toggle>
          </mat-button-toggle-group>

          <button mat-stroked-button (click)="loadAllData()" class="refresh-btn">
            <mat-icon>refresh</mat-icon> Refresh
          </button>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="reportService.isLoading()">
        <mat-spinner diameter="44"></mat-spinner>
      </div>

      <!-- Financial Metrics Summary Cards -->
      <div class="summary-kpi-grid">
        <mat-card class="kpi-box revenue-box">
          <div class="kpi-icon">
            <mat-icon>trending_up</mat-icon>
          </div>
          <div class="kpi-details">
            <span class="lbl">Total Period Revenue</span>
            <span class="val">\${{ periodRevenue() | number:'1.2-2' }}</span>
            <span class="sub">Across {{ periodOrders() }} confirmed customer orders</span>
          </div>
        </mat-card>

        <mat-card class="kpi-box orders-box">
          <div class="kpi-icon">
            <mat-icon>shopping_cart_checkout</mat-icon>
          </div>
          <div class="kpi-details">
            <span class="lbl">Total Orders Placed</span>
            <span class="val">{{ periodOrders() }}</span>
            <span class="sub">Average Order Value: \${{ averageOrderValue() | number:'1.2-2' }}</span>
          </div>
        </mat-card>

        <mat-card class="kpi-box aov-box">
          <div class="kpi-icon">
            <mat-icon>receipt</mat-icon>
          </div>
          <div class="kpi-details">
            <span class="lbl">Average Basket Size</span>
            <span class="val">\${{ averageOrderValue() | number:'1.2-2' }}</span>
            <span class="sub">Per checkout transaction</span>
          </div>
        </mat-card>

        <mat-card class="kpi-box category-box">
          <div class="kpi-icon">
            <mat-icon>pie_chart</mat-icon>
          </div>
          <div class="kpi-details">
            <span class="lbl">Top Department</span>
            <span class="val">{{ topCategoryName() }}</span>
            <span class="sub">{{ topCategoryShare() }}% of supermarket sales</span>
          </div>
        </mat-card>
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <!-- Sales Trend Line Chart -->
        <mat-card class="chart-box main-chart">
          <div class="chart-header">
            <div>
              <h3>{{ selectedDays }}-Day Revenue & Sales Velocity</h3>
              <p>Daily receipts and volume distribution</p>
            </div>
          </div>
          <div class="canvas-wrap">
            <canvas #salesChartCanvas></canvas>
          </div>
        </mat-card>

        <!-- Department Share Doughnut Chart -->
        <mat-card class="chart-box side-chart">
          <div class="chart-header">
            <div>
              <h3>Department Revenue Share</h3>
              <p>Sales contribution by supermarket aisle</p>
            </div>
          </div>
          <div class="canvas-wrap doughnut-wrap">
            <canvas #categoryChartCanvas></canvas>
          </div>
        </mat-card>
      </div>

      <!-- Product Sales Statistics Table & Order Fulfillment Metrics -->
      <div class="tables-row">
        <!-- Product Sales Statistics Table -->
        <mat-card class="product-stats-box">
          <div class="card-head">
            <div>
              <h3>Top Selling Supermarket Products</h3>
              <p>Best performing inventory items ranked by revenue and units sold</p>
            </div>
          </div>

          <table mat-table [dataSource]="reportService.topProducts()" class="stats-table">
            <!-- Product -->
            <ng-container matColumnDef="product">
              <th mat-header-cell *matHeaderCellDef>Product & SKU</th>
              <td mat-cell *matCellDef="let p">
                <div class="p-cell">
                  <span class="p-name">{{ p.product_name }}</span>
                  <span class="p-sku">SKU: {{ p.product_sku }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Department -->
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Department</th>
              <td mat-cell *matCellDef="let p">
                <span class="dept-badge">{{ p.category_name }}</span>
              </td>
            </ng-container>

            <!-- Units Sold -->
            <ng-container matColumnDef="units">
              <th mat-header-cell *matHeaderCellDef>Units Sold</th>
              <td mat-cell *matCellDef="let p">
                <span class="units-badge">{{ p.units_sold }} units</span>
              </td>
            </ng-container>

            <!-- Revenue -->
            <ng-container matColumnDef="revenue">
              <th mat-header-cell *matHeaderCellDef>Total Sales</th>
              <td mat-cell *matCellDef="let p">
                <span class="rev-val">\${{ p.total_revenue | number:'1.2-2' }}</span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="['product', 'category', 'units', 'revenue']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['product', 'category', 'units', 'revenue'];"></tr>
          </table>

          <div class="empty-state" *ngIf="reportService.topProducts().length === 0">
            <p>No product sales recorded in selected time frame.</p>
          </div>
        </mat-card>

        <!-- Order Fulfillment Health & Statistics -->
        <mat-card class="order-health-box">
          <div class="card-head">
            <div>
              <h3>Order Fulfillment Statistics</h3>
              <p>Status breakdown across supermarket workflow</p>
            </div>
          </div>

          <div class="fulfillment-stats-list">
            <div class="stat-progress-item">
              <div class="stat-top">
                <span class="stat-title">Completed & Delivered</span>
                <span class="stat-count">{{ countByStatus('COMPLETED') }} orders</span>
              </div>
              <mat-progress-bar mode="determinate" [value]="calcPercent('COMPLETED')" color="primary"></mat-progress-bar>
            </div>

            <div class="stat-progress-item">
              <div class="stat-top">
                <span class="stat-title">Processing & Packing</span>
                <span class="stat-count">{{ countByStatus('PROCESSING') + countByStatus('CONFIRMED') }} orders</span>
              </div>
              <mat-progress-bar mode="determinate" [value]="calcPercent('PROCESSING')" class="accent-bar"></mat-progress-bar>
            </div>

            <div class="stat-progress-item">
              <div class="stat-top">
                <span class="stat-title">Ready for Store Pickup</span>
                <span class="stat-count">{{ countByStatus('READY_FOR_PICKUP') }} orders</span>
              </div>
              <mat-progress-bar mode="determinate" [value]="calcPercent('READY_FOR_PICKUP')" color="primary"></mat-progress-bar>
            </div>

            <div class="stat-progress-item">
              <div class="stat-top">
                <span class="stat-title">Out for Home Delivery</span>
                <span class="stat-count">{{ countByStatus('OUT_FOR_DELIVERY') }} orders</span>
              </div>
              <mat-progress-bar mode="determinate" [value]="calcPercent('OUT_FOR_DELIVERY')" class="delivery-bar"></mat-progress-bar>
            </div>

            <div class="stat-progress-item">
              <div class="stat-top">
                <span class="stat-title">Cancelled / Returned</span>
                <span class="stat-count">{{ countByStatus('CANCELLED') }} orders</span>
              </div>
              <mat-progress-bar mode="determinate" [value]="calcPercent('CANCELLED')" color="warn"></mat-progress-bar>
            </div>
          </div>

          <div class="summary-footer-stats">
            <div class="footer-stat">
              <span class="f-num">{{ orderService.adminOrders().length }}</span>
              <span class="f-lbl">Lifetime Orders</span>
            </div>
            <div class="footer-stat">
              <span class="f-num">{{ getPickupOrdersCount() }}</span>
              <span class="f-lbl">Store Pickups</span>
            </div>
            <div class="footer-stat">
              <span class="f-num">{{ getDeliveryOrdersCount() }}</span>
              <span class="f-lbl">Home Deliveries</span>
            </div>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .reports-page-container {
      max-width: 1400px;
      margin: 28px auto;
      padding: 0 24px 60px;
      position: relative;
    }

    .reports-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;

      h1 {
        font-size: 1.7rem;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 4px;
        letter-spacing: -0.3px;
      }

      p {
        color: #64748b;
        font-size: 0.95rem;
      }

      .range-selector-wrap {
        display: flex;
        align-items: center;
        gap: 12px;

        .range-toggle {
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
        }

        .refresh-btn {
          border-radius: 8px;
          height: 38px;
        }
      }
    }

    .loading-overlay {
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

    /* KPI Grid */
    .summary-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 18px;
      margin-bottom: 24px;

      .kpi-box {
        padding: 20px;
        border-radius: 14px;
        border: 1px solid #e2e8f0;
        display: flex;
        align-items: flex-start;
        gap: 16px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);

        .kpi-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;

          mat-icon {
            font-size: 24px;
            width: 24px;
            height: 24px;
          }
        }

        &.revenue-box .kpi-icon {
          background: #ecfdf5;
          color: #059669;
        }

        &.orders-box .kpi-icon {
          background: #eff6ff;
          color: #2563eb;
        }

        &.aov-box .kpi-icon {
          background: #f5f3ff;
          color: #7c3aed;
        }

        &.category-box .kpi-icon {
          background: #fffbeb;
          color: #d97706;
        }

        .kpi-details {
          display: flex;
          flex-direction: column;

          .lbl {
            font-size: 0.8rem;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-bottom: 2px;
          }

          .val {
            font-size: 1.6rem;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
            line-height: 1.2;
          }

          .sub {
            font-size: 0.78rem;
            color: #94a3b8;
            margin-top: 4px;
          }
        }
      }
    }

    /* Charts Row */
    .charts-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 24px;

      @media (max-width: 950px) {
        grid-template-columns: 1fr;
      }

      .chart-box {
        padding: 24px;
        border-radius: 14px;
        border: 1px solid #e2e8f0;

        .chart-header {
          margin-bottom: 18px;

          h3 {
            font-size: 1.15rem;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 2px;
          }

          p {
            color: #64748b;
            font-size: 0.85rem;
          }
        }

        .canvas-wrap {
          position: relative;
          height: 320px;
          width: 100%;
        }

        .doughnut-wrap {
          height: 280px;
        }
      }
    }

    /* Tables Row */
    .tables-row {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 20px;

      @media (max-width: 950px) {
        grid-template-columns: 1fr;
      }

      .product-stats-box, .order-health-box {
        padding: 24px;
        border-radius: 14px;
        border: 1px solid #e2e8f0;

        .card-head {
          margin-bottom: 16px;

          h3 {
            font-size: 1.15rem;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 2px;
          }

          p {
            color: #64748b;
            font-size: 0.85rem;
          }
        }
      }

      .stats-table {
        width: 100%;

        th {
          font-weight: 700;
          color: #475569;
          font-size: 0.8rem;
          text-transform: uppercase;
          background: #f8fafc;
        }

        .p-cell {
          display: flex;
          flex-direction: column;

          .p-name {
            font-weight: 700;
            color: #0f172a;
            font-size: 0.9rem;
          }

          .p-sku {
            font-size: 0.75rem;
            color: #94a3b8;
          }
        }

        .dept-badge {
          background: #f0fdfa;
          color: #0f766e;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 8px;
        }

        .units-badge {
          font-weight: 700;
          color: #334155;
          font-size: 0.85rem;
        }

        .rev-val {
          font-weight: 800;
          color: #0f766e;
          font-size: 0.95rem;
        }
      }

      .order-health-box {
        .fulfillment-stats-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;

          .stat-progress-item {
            .stat-top {
              display: flex;
              justify-content: space-between;
              font-size: 0.85rem;
              font-weight: 600;
              margin-bottom: 6px;

              .stat-title { color: #334155; }
              .stat-count { color: #0f766e; font-weight: 700; }
            }
          }
        }

        .summary-footer-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          border-top: 1px solid #f1f5f9;
          padding-top: 18px;
          text-align: center;

          .footer-stat {
            display: flex;
            flex-direction: column;

            .f-num {
              font-size: 1.3rem;
              font-weight: 800;
              color: #0f172a;
            }

            .f-lbl {
              font-size: 0.72rem;
              color: #64748b;
              text-transform: uppercase;
              font-weight: 700;
              margin-top: 2px;
            }
          }
        }
      }
    }

    .empty-state {
      padding: 32px 16px;
      text-align: center;
      color: #94a3b8;
      font-size: 0.9rem;
    }
  `]
})
export class AdminReportsComponent implements OnInit, AfterViewInit {
  reportService = inject(ReportService);
  orderService = inject(OrderService);

  @ViewChild('salesChartCanvas') salesCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChartCanvas') categoryCanvas!: ElementRef<HTMLCanvasElement>;

  selectedDays = 7;
  private salesChartInstance: Chart | null = null;
  private categoryChartInstance: Chart | null = null;

  ngOnInit(): void {
    this.loadAllData();
  }

  ngAfterViewInit(): void {
    // Initial chart render when DOM is ready
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }

  loadAllData(): void {
    this.reportService.loadDashboardSummary().subscribe();
    this.reportService.loadSalesTrend(this.selectedDays).subscribe({
      next: () => this.updateSalesChart()
    });
    this.reportService.loadCategoryShares().subscribe({
      next: () => this.updateCategoryChart()
    });
    this.reportService.loadTopProducts(10).subscribe();
    this.orderService.loadAdminOrders().subscribe();
  }

  onRangeChange(): void {
    this.reportService.loadSalesTrend(this.selectedDays).subscribe({
      next: () => this.updateSalesChart()
    });
  }

  // KPI Calculations
  periodRevenue(): number {
    const points = this.reportService.salesTrend();
    if (!points || points.length === 0) {
      return Number(this.reportService.summary()?.total_revenue || 0);
    }
    return points.reduce((acc, p) => acc + Number(p.revenue), 0);
  }

  periodOrders(): number {
    const points = this.reportService.salesTrend();
    if (!points || points.length === 0) {
      return this.reportService.summary()?.total_orders || 0;
    }
    return points.reduce((acc, p) => acc + p.order_count, 0);
  }

  averageOrderValue(): number {
    const rev = this.periodRevenue();
    const orders = this.periodOrders();
    return orders > 0 ? rev / orders : 0;
  }

  topCategoryName(): string {
    const shares = this.reportService.categoryShares();
    if (!shares || shares.length === 0) return 'Produce & Dairy';
    const sorted = [...shares].sort((a, b) => Number(b.revenue) - Number(a.revenue));
    return sorted[0]?.category_name || 'Produce';
  }

  topCategoryShare(): number {
    const shares = this.reportService.categoryShares();
    if (!shares || shares.length === 0) return 40;
    const sorted = [...shares].sort((a, b) => Number(b.revenue) - Number(a.revenue));
    return sorted[0]?.percentage || 0;
  }

  // Order Fulfillment Helpers
  countByStatus(status: string): number {
    const orders = this.orderService.adminOrders();
    return orders.filter((o) => o.status === status).length;
  }

  calcPercent(status: string): number {
    const total = this.orderService.adminOrders().length;
    if (total === 0) return 0;
    const count = this.countByStatus(status);
    return Math.round((count / total) * 100);
  }

  getPickupOrdersCount(): number {
    return this.orderService.adminOrders().filter((o) => o.order_type === 'STORE_PICKUP').length;
  }

  getDeliveryOrdersCount(): number {
    return this.orderService.adminOrders().filter((o) => o.order_type === 'HOME_DELIVERY').length;
  }

  private initCharts(): void {
    if (this.salesCanvas && this.categoryCanvas) {
      this.updateSalesChart();
      this.updateCategoryChart();
    }
  }

  private updateSalesChart(): void {
    if (!this.salesCanvas) return;
    const ctx = this.salesCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.salesChartInstance) {
      this.salesChartInstance.destroy();
    }

    const points = this.reportService.salesTrend();
    const labels = points.map((p) => p.date);
    const revenues = points.map((p) => Number(p.revenue));
    const orders = points.map((p) => p.order_count);

    this.salesChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.length ? labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Daily Revenue ($)',
            data: revenues.length ? revenues : [25, 45, 60, 35, 80, 110, 95],
            borderColor: '#0f766e',
            backgroundColor: 'rgba(15, 118, 110, 0.12)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#0f766e',
            pointRadius: 4,
            yAxisID: 'y'
          },
          {
            label: 'Orders Count',
            data: orders.length ? orders : [2, 4, 5, 3, 7, 9, 8],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            borderWidth: 2,
            borderDash: [4, 4],
            fill: false,
            tension: 0.35,
            pointBackgroundColor: '#3b82f6',
            pointRadius: 3,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 } }
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {
              callback: (val) => `$${val}`
            },
            grid: { color: '#f1f5f9' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { stepSize: 1 }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  private updateCategoryChart(): void {
    if (!this.categoryCanvas) return;
    const ctx = this.categoryCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.categoryChartInstance) {
      this.categoryChartInstance.destroy();
    }

    const shares = this.reportService.categoryShares();
    const labels = shares.map((s) => s.category_name);
    const data = shares.map((s) => s.percentage);

    const colors = [
      '#0d9488',
      '#0284c7',
      '#6366f1',
      '#e11d48',
      '#d97706',
      '#16a34a',
      '#8b5cf6',
      '#ea580c'
    ];

    this.categoryChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.length ? labels : ['Fresh Produce', 'Dairy & Eggs', 'Bakery', 'Beverages', 'Pantry'],
        datasets: [
          {
            data: data.length ? data : [35, 25, 18, 12, 10],
            backgroundColor: colors.slice(0, Math.max(labels.length, 5)),
            borderWidth: 2,
            borderColor: '#ffffff'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 }
            }
          }
        },
        cutout: '65%'
      }
    });
  }
}
