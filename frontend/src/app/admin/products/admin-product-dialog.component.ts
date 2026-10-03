import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { CategoryService } from '../../core/services/category.service';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-admin-product-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-content-wrapper">
      <div class="dialog-header">
        <h2>{{ isEdit ? 'Edit Product' : 'Add New Supermarket Product' }}</h2>
        <button mat-icon-button (click)="dialogRef.close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="productForm" (ngSubmit)="onSubmit()" class="product-form">
        <div class="form-row">
          <mat-form-field appearance="outline" class="flex-2">
            <mat-label>Product Name</mat-label>
            <input matInput formControlName="name" placeholder="e.g. Organic Honeycrisp Apples" />
            <mat-error *ngIf="productForm.get('name')?.hasError('required')">Name is required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>SKU / Barcode</mat-label>
            <input matInput formControlName="sku" placeholder="PRD-APP-001" />
            <mat-error *ngIf="productForm.get('sku')?.hasError('required')">SKU is required</mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Category Aisle</mat-label>
            <mat-select formControlName="category_id">
              <mat-option *ngFor="let cat of categoryService.categories()" [value]="cat.id">
                {{ cat.name }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="productForm.get('category_id')?.hasError('required')">Category is required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Unit of Sale</mat-label>
            <mat-select formControlName="unit">
              <mat-option value="kg">Kilogram (kg)</mat-option>
              <mat-option value="pcs">Pieces (pcs)</mat-option>
              <mat-option value="pack">Pack</mat-option>
              <mat-option value="liter">Liter (L)</mat-option>
              <mat-option value="bunch">Bunch</mat-option>
              <mat-option value="bottle">Bottle</mat-option>
              <mat-option value="bag">Bag</mat-option>
              <mat-option value="box">Box</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Selling Price ($)</mat-label>
            <input matInput type="number" step="0.01" formControlName="price" placeholder="3.49" />
            <mat-icon matPrefix>attach_money</mat-icon>
            <mat-error *ngIf="productForm.get('price')?.hasError('required')">Price is required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Cost Price ($)</mat-label>
            <input matInput type="number" step="0.01" formControlName="cost_price" placeholder="2.10" />
            <mat-icon matPrefix>attach_money</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Current Stock</mat-label>
            <input matInput type="number" formControlName="stock_quantity" placeholder="50" />
            <mat-icon matPrefix>inventory_2</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Low-Stock Alert Level</mat-label>
            <input matInput type="number" formControlName="low_stock_threshold" placeholder="10" />
            <mat-icon matPrefix>warning</mat-icon>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Image URL</mat-label>
          <input matInput formControlName="image_url" placeholder="https://images.unsplash.com/..." />
          <mat-icon matPrefix>image</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Product Description</mat-label>
          <textarea matInput rows="3" formControlName="description" placeholder="Fresh organic produce sourced directly from regional certified farms..."></textarea>
        </mat-form-field>

        <div class="toggle-row">
          <mat-slide-toggle formControlName="is_active" color="primary">
            Product Active in Storefront
          </mat-slide-toggle>
        </div>

        <div class="dialog-actions">
          <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="productForm.invalid">
            {{ isEdit ? 'Save Changes' : 'Create Product' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .dialog-content-wrapper {
      padding: 20px 24px;
      max-width: 720px;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h2 {
        font-size: 1.35rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }
    }

    .product-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .form-row {
      display: flex;
      gap: 16px;

      @media (max-width: 650px) {
        flex-direction: column;
        gap: 0;
      }
    }

    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }
    .full-width { width: 100%; }

    .toggle-row {
      margin: 8px 0 20px;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;

      button[color="primary"] {
        background-color: #0f766e !important;
        color: #ffffff !important;
      }
    }
  `]
})
export class AdminProductDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<AdminProductDialogComponent>);
  categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);
  data: Product | null = inject(MAT_DIALOG_DATA);

  isEdit = !!this.data;

  productForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    sku: ['', [Validators.required]],
    category_id: [null, [Validators.required]],
    unit: ['pcs', [Validators.required]],
    price: [null, [Validators.required, Validators.min(0.01)]],
    cost_price: [0, [Validators.min(0)]],
    stock_quantity: [0, [Validators.min(0)]],
    low_stock_threshold: [10, [Validators.min(1)]],
    image_url: [''],
    description: [''],
    is_active: [true]
  });

  ngOnInit() {
    this.categoryService.loadCategories().subscribe();

    if (this.data) {
      this.productForm.patchValue({
        name: this.data.name,
        sku: this.data.sku,
        category_id: this.data.category_id,
        unit: this.data.unit,
        price: this.data.price,
        cost_price: this.data.cost_price,
        stock_quantity: this.data.stock_quantity,
        low_stock_threshold: this.data.low_stock_threshold,
        image_url: this.data.image_url || '',
        description: this.data.description || '',
        is_active: this.data.is_active
      });
    }
  }

  onSubmit() {
    if (this.productForm.invalid) return;
    this.dialogRef.close(this.productForm.value);
  }
}
