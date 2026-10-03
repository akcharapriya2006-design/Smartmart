import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StockLevel, InventoryTransaction, LowStockAlertSummary, RestockRequest } from '../models/inventory.model';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private http = inject(HttpClient);
  private notification = inject(NotificationService);

  stockLevels = signal<StockLevel[]>([]);
  transactions = signal<InventoryTransaction[]>([]);
  alertSummary = signal<LowStockAlertSummary | null>(null);
  isLoading = signal<boolean>(false);

  loadStock(sortBy = 'lowest_first'): Observable<StockLevel[]> {
    this.isLoading.set(true);
    return this.http.get<StockLevel[]>(`${environment.apiUrl}/inventory/stock`, {
      params: { sort_by: sortBy }
    }).pipe(
      tap({
        next: (data) => {
          this.stockLevels.set(data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  restock(request: RestockRequest): Observable<StockLevel> {
    return this.http.post<StockLevel>(`${environment.apiUrl}/inventory/restock`, request).pipe(
      tap((updated) => {
        this.stockLevels.update((list) =>
          list.map((item) => (item.product_id === updated.product_id ? updated : item))
        );
        this.notification.success(`Restocked ${request.quantity} units of "${updated.name}"!`);
        this.loadAlerts().subscribe();
        this.loadTransactions().subscribe();
      })
    );
  }

  loadTransactions(limit = 50): Observable<InventoryTransaction[]> {
    return this.http.get<InventoryTransaction[]>(`${environment.apiUrl}/inventory/transactions`, {
      params: { limit: limit.toString() }
    }).pipe(
      tap((data) => this.transactions.set(data))
    );
  }

  loadAlerts(): Observable<LowStockAlertSummary> {
    return this.http.get<LowStockAlertSummary>(`${environment.apiUrl}/inventory/alerts`).pipe(
      tap((summary) => this.alertSummary.set(summary))
    );
  }
}
