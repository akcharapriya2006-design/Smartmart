import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CategoryService } from '../../core/services/category.service';
import { Category } from '../../core/models/category.model';

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-wrapper">
      <div class="dialog-header">
        <h2>{{ isEdit ? 'Edit Category' : 'Create Supermarket Category' }}</h2>
        <button mat-icon-button (click)="dialogRef.close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="catForm" (ngSubmit)="onSubmit()" class="cat-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Category Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Organic Dairy & Cheeses" />
          <mat-error *ngIf="catForm.get('name')?.hasError('required')">Category name is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Banner Image URL</mat-label>
          <input matInput formControlName="image_url" placeholder="https://images.unsplash.com/..." />
          <mat-icon matPrefix>image</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Department Description</mat-label>
          <textarea matInput rows="3" formControlName="description" placeholder="Farm-fresh dairy items, butter, cream, and artisan cheeses..."></textarea>
        </mat-form-field>

        <div class="toggle-row">
          <mat-slide-toggle formControlName="is_active" color="primary">
            Active in Customer Storefront
          </mat-slide-toggle>
        </div>

        <div class="dialog-actions">
          <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="catForm.invalid">
            {{ isEdit ? 'Save Changes' : 'Create Category' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .dialog-wrapper {
      padding: 20px 24px;
      max-width: 500px;
    }
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      h2 { font-size: 1.3rem; font-weight: 700; margin: 0; color: #0f172a; }
    }
    .cat-form { display: flex; flex-direction: column; gap: 8px; }
    .full-width { width: 100%; }
    .toggle-row { margin: 8px 0 16px; }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;
      button[color="primary"] { background-color: #0f766e !important; color: #ffffff !important; }
    }
  `]
})
export class CategoryDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<CategoryDialogComponent>);
  private fb = inject(FormBuilder);
  data: Category | null = inject(MAT_DIALOG_DATA);

  isEdit = !!this.data;

  catForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    image_url: [''],
    description: [''],
    is_active: [true]
  });

  ngOnInit() {
    if (this.data) {
      this.catForm.patchValue({
        name: this.data.name,
        image_url: this.data.image_url || '',
        description: this.data.description || '',
        is_active: this.data.is_active
      });
    }
  }

  onSubmit() {
    if (this.catForm.invalid) return;
    this.dialogRef.close(this.catForm.value);
  }
}

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="admin-page-container">
      <div class="admin-header">
        <div>
          <h1>Supermarket Aisles & Categories</h1>
          <p>Organize product departments and configure storefront navigation.</p>
        </div>

        <button mat-flat-button color="primary" class="add-btn" (click)="openDialog()">
          <mat-icon>add</mat-icon>
          <span>Add New Category</span>
        </button>
      </div>

      <mat-card class="table-card">
        <table mat-table [dataSource]="categoryService.categories()" class="modern-table">
          <!-- Image -->
          <ng-container matColumnDef="image">
            <th mat-header-cell *matHeaderCellDef>Banner</th>
            <td mat-cell *matCellDef="let cat">
              <img [src]="cat.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80'" class="cat-thumb" [alt]="cat.name" />
            </td>
          </ng-container>

          <!-- Name & Description -->
          <ng-container matColumnDef="name_desc">
            <th mat-header-cell *matHeaderCellDef>Category & Description</th>
            <td mat-cell *matCellDef="let cat">
              <div class="name-cell">
                <span class="cat-title">{{ cat.name }}</span>
                <span class="cat-desc">{{ cat.description || 'No description provided.' }}</span>
              </div>
            </td>
          </ng-container>

          <!-- Product Count -->
          <ng-container matColumnDef="product_count">
            <th mat-header-cell *matHeaderCellDef>Active Products</th>
            <td mat-cell *matCellDef="let cat">
              <span class="count-chip">{{ cat.product_count || 0 }} Items</span>
            </td>
          </ng-container>

          <!-- Status -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let cat">
              <span class="status-pill" [class.active]="cat.is_active" [class.inactive]="!cat.is_active">
                {{ cat.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
          </ng-container>

          <!-- Actions -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="text-right">Actions</th>
            <td mat-cell *matCellDef="let cat" class="text-right">
              <button mat-icon-button color="primary" matTooltip="Edit Category" (click)="openDialog(cat)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button [color]="cat.is_active ? 'warn' : 'accent'" [matTooltip]="cat.is_active ? 'Deactivate' : 'Activate'" (click)="toggleActive(cat)">
                <mat-icon>{{ cat.is_active ? 'toggle_on' : 'toggle_off' }}</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
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
    .table-card {
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      .modern-table {
        width: 100%;
        th { font-weight: 700; color: #475569; font-size: 0.85rem; text-transform: uppercase; background: #f8fafc; padding: 14px 16px; }
        td { padding: 12px 16px; color: #1e293b; border-bottom: 1px solid #f1f5f9; }
        .cat-thumb { width: 56px; height: 42px; border-radius: 8px; object-fit: cover; }
        .name-cell { display: flex; flex-direction: column; .cat-title { font-weight: 700; color: #0f172a; } .cat-desc { font-size: 0.8rem; color: #64748b; } }
        .count-chip { background: #f0fdfa; color: #0f766e; font-weight: 700; font-size: 0.8rem; padding: 4px 10px; border-radius: 12px; }
        .status-pill {
          display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;
          &.active { background: #dcfce7; color: #15803d; }
          &.inactive { background: #f1f5f9; color: #64748b; }
        }
        .text-right { text-align: right; }
      }
    }
  `]
})
export class AdminCategoriesComponent implements OnInit {
  categoryService = inject(CategoryService);
  private dialog = inject(MatDialog);

  columns = ['image', 'name_desc', 'product_count', 'status', 'actions'];

  ngOnInit() {
    this.categoryService.loadCategories(true).subscribe();
  }

  openDialog(category?: Category) {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      data: category || null,
      width: '520px'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (category) {
          this.categoryService.updateCategory(category.id, result).subscribe();
        } else {
          this.categoryService.createCategory(result).subscribe();
        }
      }
    });
  }

  toggleActive(category: Category) {
    this.categoryService.deleteCategory(category.id).subscribe();
  }
}
