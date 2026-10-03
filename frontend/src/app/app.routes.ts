import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ProfileComponent } from './customer/profile/profile.component';
import { CatalogComponent } from './customer/catalog/catalog.component';
import { ProductDetailComponent } from './customer/product-detail/product-detail.component';
import { CartComponent } from './customer/cart/cart.component';
import { WishlistComponent } from './customer/wishlist/wishlist.component';
import { CheckoutComponent } from './customer/checkout/checkout.component';
import { OrderHistoryComponent } from './customer/orders/order-history.component';

import { AdminLayoutComponent } from './admin/admin-layout.component';
import { AdminDashboardComponent } from './admin/dashboard/admin-dashboard.component';
import { AdminProductsComponent } from './admin/products/admin-products.component';
import { AdminCategoriesComponent } from './admin/categories/admin-categories.component';
import { AdminInventoryComponent } from './admin/inventory/admin-inventory.component';
import { AdminOrdersComponent } from './admin/orders/admin-orders.component';
import { AdminCustomersComponent } from './admin/customers/admin-customers.component';
import { AdminReportsComponent } from './admin/reports/admin-reports.component';

import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Customer Routes
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full'
  },
  {
    path: 'products',
    component: CatalogComponent
  },
  {
    path: 'products/:id',
    component: ProductDetailComponent
  },
  {
    path: 'wishlist',
    component: WishlistComponent
  },
  {
    path: 'cart',
    component: CartComponent
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [authGuard]
  },
  {
    path: 'orders',
    component: OrderHistoryComponent,
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },

  // Admin Routes (Nested under AdminLayoutComponent and protected by adminGuard)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: AdminDashboardComponent
      },
      {
        path: 'products',
        component: AdminProductsComponent
      },
      {
        path: 'categories',
        component: AdminCategoriesComponent
      },
      {
        path: 'inventory',
        component: AdminInventoryComponent
      },
      {
        path: 'orders',
        component: AdminOrdersComponent
      },
      {
        path: 'customers',
        component: AdminCustomersComponent
      },
      {
        path: 'reports',
        component: AdminReportsComponent
      }
    ]
  },

  // Fallback
  {
    path: '**',
    redirectTo: 'products'
  }
];
