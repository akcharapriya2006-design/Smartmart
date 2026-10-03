import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, CheckoutRequest, OrderStatus } from '../models/order.model';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private notification = inject(NotificationService);

  orders = signal<Order[]>([]);
  adminOrders = signal<Order[]>([]);
  isLoading = signal<boolean>(false);

  checkout(request: CheckoutRequest): Observable<Order> {
    this.isLoading.set(true);
    return this.http.post<Order>(`${environment.apiUrl}/orders/checkout`, request).pipe(
      tap({
        next: (order) => {
          this.orders.update((list) => [order, ...list]);
          this.isLoading.set(false);
          this.notification.success(`Order ${order.order_number} confirmed!`);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  getMyOrders(): Observable<Order[]> {
    this.isLoading.set(true);
    return this.http.get<Order[]>(`${environment.apiUrl}/orders/my-orders`).pipe(
      tap({
        next: (list) => {
          this.orders.set(list);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  getMyOrderDetail(id: number): Observable<Order> {
    return this.http.get<Order>(`${environment.apiUrl}/orders/my-orders/${id}`);
  }

  getAdminOrders(status?: OrderStatus, search?: string): Observable<Order[]> {
    this.isLoading.set(true);
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (search) params = params.set('search', search.trim());

    return this.http.get<Order[]>(`${environment.apiUrl}/orders/admin/all`, { params }).pipe(
      tap({
        next: (list) => {
          this.adminOrders.set(list);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  loadAdminOrders(status?: OrderStatus, search?: string): Observable<Order[]> {
    return this.getAdminOrders(status, search);
  }

  updateOrderStatus(orderId: number, newStatus: OrderStatus): Observable<Order> {
    return this.http.put<Order>(`${environment.apiUrl}/orders/admin/${orderId}/status`, { status: newStatus }).pipe(
      tap((updated) => {
        this.adminOrders.update((list) => list.map((o) => (o.id === orderId ? updated : o)));
        this.notification.success(`Order ${updated.order_number} status updated to ${newStatus}`);
      })
    );
  }
}
