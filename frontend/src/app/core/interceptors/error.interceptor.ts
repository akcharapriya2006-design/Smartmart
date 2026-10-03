import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (error.error) {
        if (typeof error.error.detail === 'string') {
          errorMessage = error.error.detail;
        } else if (Array.isArray(error.error.detail)) {
          // Pydantic validation error array
          errorMessage = error.error.detail.map((d: any) => d.msg).join(', ');
        } else if (error.error.message) {
          errorMessage = error.error.message;
        }
      }

      if (error.status === 401) {
        localStorage.removeItem('smartmart_access_token');
        localStorage.removeItem('smartmart_user');
        // Do not redirect to login if on public endpoints or background cart checks
        if (!req.url.includes('/auth/login') && !req.url.includes('/auth/register') && !req.url.includes('/cart/')) {
          notification.error('Session expired. Please log in again.');
          router.navigate(['/login']);
        }
      } else if (error.status === 403) {
        notification.error('You do not have permission to perform this action.');
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
        notification.error(errorMessage);
      } else {
        // Show validation or other errors
        notification.error(errorMessage);
      }

      return throwError(() => error);
    })
  );
};
