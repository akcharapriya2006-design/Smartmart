import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { Product } from '../../core/models/product.model';
import { AdminProductDialogComponent } from './admin-product-dialog.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="admin-page-container">
      <!-- Admin Header -->
      <div class="admin-header">
        <div>
          <h1>Product Catalog Management</h1>
          <p>Create, update supermarket products, pricing, and monitor real-time stock levels.</p>
        </div>

        <button mat-flat-button color="primary" class="add-btn" (click)="openProductDialog()">
          <mat-icon>add</mat-icon>
          <span>Add New Product</span>
        </button>
      </div>

      <!-- Filters & Search Toolbar -->
      <mat-card class="filter-card">
        <div class="filter-row">
          <div class="search-box">
            <mat-icon>search</mat-icon>
            <input 
              type="text" 
              placeholder="Search product name or SKU..." 
              [(ngModel)]="search" 
              (keyup.enter)="loadData()" 
            />
            <button mat-icon-button *ngIf="search" (click)="search = ''; loadData()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <mat-form-field appearance="outline" class="filter-select">
            <mat-label>Category Aisle</mat-label>
            <mat-select [(ngModel)]="selectedCategory" (selectionChange)="loadData()">
              <mat-option [value]="null">All Categories</mat-option>
              <mat-option *ngFor="let cat of categoryService.categories()" [value]="cat.id">
                {{ cat.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-select">
            <mat-label>Stock Filter</mat-label>
            <mat-select [(ngModel)]="stockFilter" (selectionChange)="loadData()">
              <mat-option value="ALL">All Stock Levels</mat-option>
              <mat-option value="LOW">Low Stock Alert (&le; Threshold)</mat-option>
              <mat-option value="IN_STOCK">In Stock (> 0)</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-stroked-button (click)="loadData()" class="apply-btn">
            <mat-icon>refresh</mat-icon> Refresh
          </button>
        </div>
      </mat-card>

      <!-- Products Data Table Card -->
      <mat-card class="table-card">
        <div class="loading-overlay" *ngIf="productService.isLoading()">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <div class="table-responsive">
          <table mat-table [dataSource]="productService.products()" class="mat-elevation-z0 modern-table">
            <!-- Image Column -->
            <ng-container matColumnDef="image">
              <th mat-header-cell *matHeaderCellDef>Photo</th>
              <td mat-cell *matCellDef="let p">
                <img [src]="p.image_url || defaultImageUrl" class="thumb-img" [alt]="p.name" (error)="onImageError($event)" />
              </td>
            </ng-container>

            <!-- Name & SKU Column -->
            <ng-container matColumnDef="name_sku">
              <th mat-header-cell *matHeaderCellDef>Product & SKU</th>
              <td mat-cell *matCellDef="let p">
                <div class="title-cell">
                  <span class="p-name">{{ p.name }}</span>
                  <span class="p-sku">{{ p.sku }} • {{ p.unit }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Category Column -->
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Aisle</th>
              <td mat-cell *matCellDef="let p">
                <span class="cat-pill">{{ p.category_name }}</span>
              </td>
            </ng-container>

            <!-- Pricing Column -->
            <ng-container matColumnDef="pricing">
              <th mat-header-cell *matHeaderCellDef>Selling / Cost</th>
              <td mat-cell *matCellDef="let p">
                <div class="pricing-cell">
                  <span class="sale-price">\${{ p.price | number:'1.2-2' }}</span>
                  <span class="cost-price" *ngIf="p.cost_price">Cost: \${{ p.cost_price | number:'1.2-2' }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Stock Column -->
            <ng-container matColumnDef="stock">
              <th mat-header-cell *matHeaderCellDef>Inventory Stock</th>
              <td mat-cell *matCellDef="let p">
                <div class="stock-cell">
                  <span class="stock-number">{{ p.stock_quantity }} {{ p.unit }}</span>
                  <span class="stock-tag low" *ngIf="p.is_low_stock && p.stock_quantity > 0">
                    <mat-icon>warning</mat-icon> Low (&le;{{ p.low_stock_threshold }})
                  </span>
                  <span class="stock-tag out" *ngIf="p.stock_quantity === 0">
                    Out of Stock
                  </span>
                </div>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let p">
                <span class="status-pill" [class.active]="p.is_active" [class.inactive]="!p.is_active">
                  {{ p.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="text-right">Actions</th>
              <td mat-cell *matCellDef="let p" class="text-right">
                <button mat-icon-button color="primary" matTooltip="Edit Product" (click)="openProductDialog(p)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button [color]="p.is_active ? 'warn' : 'accent'" [matTooltip]="p.is_active ? 'Deactivate' : 'Activate'" (click)="toggleActive(p)">
                  <mat-icon>{{ p.is_active ? 'toggle_on' : 'toggle_off' }}</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>

        <mat-paginator 
          [length]="productService.totalProducts()" 
          [pageSize]="productService.pageSize()" 
          [pageSizeOptions]="[10, 25, 50]" 
          (page)="onPageChange($event)">
        </mat-paginator>
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

      h1 {
        font-size: 1.7rem;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 4px;
      }

      p {
        color: #64748b;
        font-size: 0.95rem;
      }

      .add-btn {
        background-color: #0f766e !important;
        color: #ffffff !important;
        height: 44px;
        font-weight: 600;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
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

          mat-icon {
            color: #64748b;
            margin-right: 6px;
          }

          input {
            border: none;
            background: transparent;
            outline: none;
            width: 100%;
            font-size: 0.95rem;
            color: #1e293b;
          }
        }

        .filter-select {
          flex: 1;
          min-width: 180px;
          margin-bottom: -16px;
        }

        .apply-btn {
          height: 48px;
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
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 5;
      }

      .table-responsive {
        overflow-x: auto;
      }

      .modern-table {
        width: 100%;

        th {
          font-weight: 700;
          color: #475569;
          font-size: 0.85rem;
          text-transform: uppercase;
          background: #f8fafc;
          padding: 14px 16px;
        }

        td {
          padding: 12px 16px;
          color: #1e293b;
          border-bottom: 1px solid #f1f5f9;
        }

        .thumb-img {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          object-fit: cover;
          background: #f1f5f9;
        }

        .title-cell {
          display: flex;
          flex-direction: column;

          .p-name {
            font-weight: 700;
            color: #0f172a;
          }

          .p-sku {
            font-size: 0.78rem;
            color: #64748b;
          }
        }

        .cat-pill {
          background: #f0fdfa;
          color: #0f766e;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 12px;
        }

        .pricing-cell {
          display: flex;
          flex-direction: column;

          .sale-price {
            font-weight: 700;
            color: #0f172a;
          }

          .cost-price {
            font-size: 0.75rem;
            color: #94a3b8;
          }
        }

        .stock-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .stock-number {
            font-weight: 700;
          }

          .stock-tag {
            display: inline-flex;
            align-items: center;
            gap: 2px;
            font-size: 0.72rem;
            font-weight: 700;
            width: fit-content;
            padding: 2px 6px;
            border-radius: 6px;

            mat-icon {
              font-size: 13px;
              width: 13px;
              height: 13px;
            }

            &.low {
              background: #fef3c7;
              color: #b45309;
            }

            &.out {
              background: #fee2e2;
              color: #b91c1c;
            }
          }
        }

        .status-pill {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;

          &.active {
            background: #dcfce7;
            color: #15803d;
          }

          &.inactive {
            background: #f1f5f9;
            color: #64748b;
          }
        }

        .text-right {
          text-align: right;
        }
      }
    }
  `]
})
export class AdminProductsComponent implements OnInit {
  productService = inject(ProductService);
  categoryService = inject(CategoryService);
  private dialog = inject(MatDialog);

  displayedColumns = ['image', 'name_sku', 'category', 'pricing', 'stock', 'status', 'actions'];

  search = '';
  selectedCategory: number | null = null;
  stockFilter = 'ALL';
  readonly defaultImageUrl = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80';

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && target.src !== this.defaultImageUrl) {
      target.src = this.defaultImageUrl;
    }
  }

  ngOnInit() {
    this.categoryService.loadCategories(true).subscribe();
    this.loadData();
  }

  loadData(page = 1) {
    this.productService.getProducts({
      search: this.search.trim() || undefined,
      category_id: this.selectedCategory || undefined,
      low_stock_only: this.stockFilter === 'LOW' ? true : undefined,
      in_stock_only: this.stockFilter === 'IN_STOCK' ? true : undefined,
      include_inactive: true,
      page,
      size: 20
    }).subscribe();
  }

  onPageChange(event: PageEvent) {
    this.loadData(event.pageIndex + 1);
  }

  openProductDialog(product?: Product) {
    const dialogRef = this.dialog.open(AdminProductDialogComponent, {
      data: product || null,
      width: '740px'
    });

    dialogRef.afterClosed().subscribe((formData) => {
      if (formData) {
        if (product) {
          this.productService.updateProduct(product.id, formData).subscribe();
        } else {
          this.productService.createProduct(formData).subscribe();
        }
      }
    });
  }

  toggleActive(product: Product) {
    this.productService.deleteProduct(product.id).subscribe();
  }
}
