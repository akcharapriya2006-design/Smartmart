import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notification = inject(NotificationService);

  if (authService.isLoggedIn() && authService.isAdmin()) {
    return true;
  }

  notification.error('Access restricted to SmartMart administrators.');
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
