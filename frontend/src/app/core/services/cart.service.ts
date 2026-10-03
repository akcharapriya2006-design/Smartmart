import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CartSummary, CartItem } from '../models/cart.model';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);

  cart = signal<CartSummary | null>(null);
  isLoading = signal<boolean>(false);

  // Computed properties
  items = computed<CartItem[]>(() => this.cart()?.items || []);
  itemCount = computed<number>(() => this.cart()?.item_count || 0);
  subtotal = computed<number>(() => this.cart()?.subtotal || 0);
  deliveryFee = computed<number>(() => this.cart()?.delivery_fee || 0);
  tax = computed<number>(() => this.cart()?.estimated_tax || 0);
  total = computed<number>(() => this.cart()?.estimated_total || 0);
  amountForFreeDelivery = computed<number>(() => this.cart()?.amount_needed_for_free_delivery || 0);

  constructor() {
    if (this.authService.isLoggedIn()) {
      this.loadCart().subscribe();
    }
  }

  loadCart(): Observable<CartSummary> {
    this.isLoading.set(true);
    return this.http.get<CartSummary>(`${environment.apiUrl}/cart/`).pipe(
      tap({
        next: (data) => {
          this.cart.set(data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  addItem(productId: number, quantity = 1): Observable<CartSummary> {
    if (!this.authService.isLoggedIn()) {
      this.notification.info('Please sign in to add products to your cart');
      return new Observable();
    }

    this.isLoading.set(true);
    return this.http.post<CartSummary>(`${environment.apiUrl}/cart/items`, { product_id: productId, quantity }).pipe(
      tap({
        next: (updatedCart) => {
          this.cart.set(updatedCart);
          this.isLoading.set(false);
          this.notification.success('Item added to supermarket cart!');
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  updateQuantity(itemId: number, quantity: number): Observable<CartSummary> {
    this.isLoading.set(true);
    return this.http.put<CartSummary>(`${environment.apiUrl}/cart/items/${itemId}`, { quantity }).pipe(
      tap({
        next: (updatedCart) => {
          this.cart.set(updatedCart);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  removeItem(itemId: number): Observable<CartSummary> {
    this.isLoading.set(true);
    return this.http.delete<CartSummary>(`${environment.apiUrl}/cart/items/${itemId}`).pipe(
      tap({
        next: (updatedCart) => {
          this.cart.set(updatedCart);
          this.isLoading.set(false);
          this.notification.info('Item removed from cart');
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  clearCart(): Observable<CartSummary> {
    this.isLoading.set(true);
    return this.http.delete<CartSummary>(`${environment.apiUrl}/cart/`).pipe(
      tap({
        next: (cleared) => {
          this.cart.set(cleared);
          this.isLoading.set(false);
          this.notification.info('Cart cleared');
        },
        error: () => this.isLoading.set(false)
      })
    );
  }
}
