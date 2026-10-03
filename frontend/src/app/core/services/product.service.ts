import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductListResponse, ProductFilterParams, ProductCreateRequest, ProductUpdateRequest } from '../models/product.model';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private notification = inject(NotificationService);

  products = signal<Product[]>([]);
  totalProducts = signal<number>(0);
  totalPages = signal<number>(1);
  currentPage = signal<number>(1);
  pageSize = signal<number>(24);
  isLoading = signal<boolean>(false);

  getProducts(filters: ProductFilterParams = {}): Observable<ProductListResponse> {
    this.isLoading.set(true);
    let params = new HttpParams();

    if (filters.search) params = params.set('search', filters.search);
    if (filters.category_id) params = params.set('category_id', filters.category_id.toString());
    if (filters.min_price != null) params = params.set('min_price', filters.min_price.toString());
    if (filters.max_price != null) params = params.set('max_price', filters.max_price.toString());
    if (filters.in_stock_only != null) params = params.set('in_stock_only', filters.in_stock_only.toString());
    if (filters.low_stock_only != null) params = params.set('low_stock_only', filters.low_stock_only.toString());
    if (filters.sort_by) params = params.set('sort_by', filters.sort_by);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.size) params = params.set('size', filters.size.toString());
    if (filters.include_inactive != null) params = params.set('include_inactive', filters.include_inactive.toString());

    return this.http.get<ProductListResponse>(`${environment.apiUrl}/products/`, { params }).pipe(
      tap({
        next: (res) => {
          this.products.set(res.items);
          this.totalProducts.set(res.total);
          this.totalPages.set(res.total_pages);
          this.currentPage.set(res.page);
          this.pageSize.set(res.size);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${environment.apiUrl}/products/${id}`);
  }

  createProduct(product: ProductCreateRequest): Observable<Product> {
    return this.http.post<Product>(`${environment.apiUrl}/products/`, product).pipe(
      tap((newProd) => {
        this.products.update((prods) => [newProd, ...prods]);
        this.notification.success(`Product "${newProd.name}" added to supermarket catalog!`);
      })
    );
  }

  updateProduct(id: number, product: ProductUpdateRequest): Observable<Product> {
    return this.http.put<Product>(`${environment.apiUrl}/products/${id}`, product).pipe(
      tap((updated) => {
        this.products.update((prods) => prods.map((p) => (p.id === id ? updated : p)));
        this.notification.success(`Product "${updated.name}" updated successfully`);
      })
    );
  }

  deleteProduct(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/products/${id}`).pipe(
      tap((res) => {
        this.notification.info(res.message);
        this.getProducts({ page: this.currentPage(), size: this.pageSize(), include_inactive: true }).subscribe();
      })
    );
  }
}
