import { Injectable, inject, signal, computed } from '@angular/core';
import { Product } from '../models/product.model';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private notification = inject(NotificationService);
  private authService = inject(AuthService);

  private readonly STORAGE_PREFIX = 'smartmart_wishlist_';

  items = signal<Product[]>(this.loadFromStorage());
  count = computed(() => this.items().length);

  constructor() {
    // When user changes, reload corresponding wishlist
    // Default storage key per user or guest
  }

  private getStorageKey(): string {
    const userId = this.authService.currentUser()?.id;
    return `${this.STORAGE_PREFIX}${userId || 'guest'}`;
  }

  private loadFromStorage(): Product[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.getStorageKey());
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(products: Product[]) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(products));
    } catch {
      // storage full or disabled
    }
  }

  isInWishlist(productId: number): boolean {
    return this.items().some((p) => p.id === productId);
  }

  toggleWishlist(product: Product) {
    const exists = this.isInWishlist(product.id);
    if (exists) {
      this.removeFromWishlist(product.id);
      this.notification.info(`Removed "${product.name}" from wishlist`);
    } else {
      const updated = [product, ...this.items()];
      this.items.set(updated);
      this.saveToStorage(updated);
      this.notification.success(`Added "${product.name}" to wishlist`);
    }
  }

  removeFromWishlist(productId: number) {
    const updated = this.items().filter((p) => p.id !== productId);
    this.items.set(updated);
    this.saveToStorage(updated);
  }

  clearWishlist() {
    this.items.set([]);
    this.saveToStorage([]);
  }
}
