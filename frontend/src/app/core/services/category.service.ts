import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, CategoryCreateRequest, CategoryUpdateRequest } from '../models/category.model';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private notification = inject(NotificationService);

  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(false);

  loadCategories(includeInactive = false): Observable<Category[]> {
    this.isLoading.set(true);
    return this.http.get<Category[]>(`${environment.apiUrl}/categories/`, {
      params: { include_inactive: includeInactive }
    }).pipe(
      tap({
        next: (data) => {
          this.categories.set(data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  createCategory(category: CategoryCreateRequest): Observable<Category> {
    return this.http.post<Category>(`${environment.apiUrl}/categories/`, category).pipe(
      tap((newCat) => {
        this.categories.update((cats) => [...cats, newCat]);
        this.notification.success(`Category "${newCat.name}" created successfully`);
      })
    );
  }

  updateCategory(id: number, category: CategoryUpdateRequest): Observable<Category> {
    return this.http.put<Category>(`${environment.apiUrl}/categories/${id}`, category).pipe(
      tap((updated) => {
        this.categories.update((cats) => cats.map((c) => (c.id === id ? updated : c)));
        this.notification.success(`Category "${updated.name}" updated successfully`);
      })
    );
  }

  deleteCategory(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/categories/${id}`).pipe(
      tap((res) => {
        this.notification.info(res.message);
        this.loadCategories(true).subscribe();
      })
    );
  }
}
