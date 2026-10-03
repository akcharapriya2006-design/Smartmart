import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DashboardSummary,
  SalesTrendPoint,
  CategorySharePoint,
  TopProduct,
  CustomerSummary
} from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);

  summary = signal<DashboardSummary | null>(null);
  salesTrend = signal<SalesTrendPoint[]>([]);
  categoryShares = signal<CategorySharePoint[]>([]);
  topProducts = signal<TopProduct[]>([]);
  customers = signal<CustomerSummary[]>([]);
  isLoading = signal<boolean>(false);

  loadDashboardSummary(): Observable<DashboardSummary> {
    this.isLoading.set(true);
    return this.http.get<DashboardSummary>(`${environment.apiUrl}/reports/dashboard-summary`).pipe(
      tap({
        next: (data) => {
          this.summary.set(data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  loadSalesTrend(days = 7): Observable<SalesTrendPoint[]> {
    return this.http.get<SalesTrendPoint[]>(`${environment.apiUrl}/reports/sales-trend`, {
      params: { days: days.toString() }
    }).pipe(
      tap((points) => this.salesTrend.set(points))
    );
  }

  loadCategoryShares(): Observable<CategorySharePoint[]> {
    return this.http.get<CategorySharePoint[]>(`${environment.apiUrl}/reports/category-shares`).pipe(
      tap((shares) => this.categoryShares.set(shares))
    );
  }

  loadTopProducts(limit = 5): Observable<TopProduct[]> {
    return this.http.get<TopProduct[]>(`${environment.apiUrl}/reports/top-products`, {
      params: { limit: limit.toString() }
    }).pipe(
      tap((prods) => this.topProducts.set(prods))
    );
  }

  loadCustomers(): Observable<CustomerSummary[]> {
    return this.http.get<CustomerSummary[]>(`${environment.apiUrl}/reports/customers`).pipe(
      tap((custs) => this.customers.set(custs))
    );
  }

  updateCustomerStatus(userId: number, isActive: boolean): Observable<CustomerSummary> {
    return this.http.put<CustomerSummary>(`${environment.apiUrl}/reports/customers/${userId}/status`, {
      is_active: isActive
    }).pipe(
      tap((updated) => {
        const currentList = this.customers();
        const nextList = currentList.map((c) => (c.user_id === userId ? { ...c, is_active: updated.is_active } : c));
        this.customers.set(nextList);
      })
    );
  }
}

