import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { LogoComponent } from '../logo/logo.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    LogoComponent
  ],
  template: `
    <header class="navbar-wrapper">
      <mat-toolbar class="main-toolbar">
        <!-- Brand Logo -->
        <a routerLink="/" class="brand-link">
          <app-logo size="md" tagline="Fresh Supermarket"></app-logo>
        </a>

        <!-- Center Nav Links -->
        <nav class="nav-links">
          <a mat-button routerLink="/products" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: false}">
            <mat-icon>storefront</mat-icon>
            <span>Products</span>
          </a>

          <a mat-button *ngIf="authService.isCustomer()" routerLink="/orders" routerLinkActive="active-link">
            <mat-icon>receipt_long</mat-icon>
            <span>My Orders</span>
          </a>

          <!-- Admin Portal Link -->
          <a mat-flat-button *ngIf="authService.isAdmin()" routerLink="/admin/dashboard" class="admin-portal-btn" routerLinkActive="active-admin">
            <mat-icon>dashboard_customize</mat-icon>
            <span>Admin Portal</span>
          </a>
        </nav>

        <span class="spacer"></span>

        <!-- Right Action Items -->
        <div class="action-items">
          <!-- Customer Wishlist -->
          <a mat-icon-button routerLink="/wishlist" class="wishlist-btn" matTooltip="Saved Wishlist">
            <mat-icon [matBadge]="wishlistCount()" [matBadgeHidden]="wishlistCount() === 0" matBadgeColor="accent">
              favorite
            </mat-icon>
          </a>

          <!-- Customer Shopping Cart -->
          <a mat-icon-button routerLink="/cart" class="cart-btn" matTooltip="Shopping Cart">
            <mat-icon [matBadge]="cartItemCount()" [matBadgeHidden]="cartItemCount() === 0" matBadgeColor="warn">
              shopping_cart
            </mat-icon>
          </a>

          <!-- Unauthenticated State -->
          <ng-container *ngIf="!authService.isLoggedIn()">
            <a mat-button routerLink="/login" class="login-btn">
              <mat-icon>login</mat-icon> Sign In
            </a>
            <a mat-flat-button color="primary" routerLink="/register" class="register-btn">
              Register
            </a>
          </ng-container>

          <!-- Authenticated User Menu -->
          <ng-container *ngIf="authService.isLoggedIn()">
            <button mat-button [matMenuTriggerFor]="userMenu" class="user-profile-btn">
              <div class="user-avatar">
                {{ userInitials() }}
              </div>
              <span class="user-display-name" [title]="authService.currentUser()?.full_name || ''">{{ authService.currentUser()?.full_name }}</span>
              <mat-icon>arrow_drop_down</mat-icon>
            </button>

            <mat-menu #userMenu="matMenu" xPosition="before" class="smartmart-menu">
              <div class="menu-user-info">
                <p class="menu-name">{{ authService.currentUser()?.full_name }}</p>
                <p class="menu-email">{{ authService.currentUser()?.email }}</p>
                <span class="role-badge" [class.admin]="authService.isAdmin()">
                  {{ authService.currentUser()?.role }}
                </span>
              </div>
              <mat-divider></mat-divider>

              <button mat-menu-item routerLink="/profile">
                <mat-icon>account_circle</mat-icon>
                <span>My Profile</span>
              </button>

              <button mat-menu-item *ngIf="authService.isCustomer()" routerLink="/orders">
                <mat-icon>shopping_bag</mat-icon>
                <span>Order History</span>
              </button>

              <button mat-menu-item *ngIf="authService.isAdmin()" routerLink="/admin/dashboard">
                <mat-icon>admin_panel_settings</mat-icon>
                <span>Admin Dashboard</span>
              </button>

              <mat-divider></mat-divider>
              <button mat-menu-item (click)="authService.logout()" class="logout-menu-item">
                <mat-icon color="warn">logout</mat-icon>
                <span>Sign Out</span>
              </button>
            </mat-menu>
          </ng-container>
        </div>
      </mat-toolbar>

      <!-- Admin Secondary Sub-Bar (Shown for Admin users) -->
      <div class="admin-sub-bar" *ngIf="authService.isAdmin()">
        <div class="sub-bar-container">
          <div class="sub-bar-label">
            <mat-icon>admin_panel_settings</mat-icon>
            <span>Supermarket Management:</span>
          </div>

          <nav class="admin-sub-nav">
            <a routerLink="/admin/dashboard" routerLinkActive="active-sub">
              <mat-icon>analytics</mat-icon> Dashboard
            </a>
            <a routerLink="/admin/products" routerLinkActive="active-sub">
              <mat-icon>inventory_2</mat-icon> Products
            </a>
            <a routerLink="/admin/categories" routerLinkActive="active-sub">
              <mat-icon>category</mat-icon> Categories
            </a>
            <a routerLink="/admin/inventory" routerLinkActive="active-sub">
              <mat-icon>add_business</mat-icon> Inventory & Alerts
            </a>
            <a routerLink="/admin/orders" routerLinkActive="active-sub">
              <mat-icon>receipt_long</mat-icon> Orders
            </a>
            <a routerLink="/admin/customers" routerLinkActive="active-sub">
              <mat-icon>group</mat-icon> Customers
            </a>
          </nav>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar-wrapper {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #ffffff;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      border-bottom: 1px solid #e2e8f0;
    }

    .main-toolbar {
      background: transparent;
      height: 70px;
      padding: 0 24px;
      max-width: 1440px;
      margin: 0 auto;
      display: flex;
      align-items: center;
    }

    .brand-link {
      display: flex;
      align-items: center;
      margin-right: 32px;
      cursor: pointer;
      text-decoration: none;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 8px;

      a {
        font-weight: 600;
        color: #475569;
        border-radius: 8px;

        mat-icon {
          margin-right: 6px;
        }

        &.active-link {
          color: #0f766e;
          background: #f0fdfa;
        }
      }

      .admin-portal-btn {
        background: #0f172a;
        color: #ffffff;
        margin-left: 8px;

        &:hover {
          background: #1e293b;
        }

        &.active-admin {
          background: #0f766e;
        }
      }
    }

    .spacer {
      flex: 1 1 auto;
    }

    .action-items {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .cart-btn {
      color: #1e293b;
    }

    .login-btn {
      font-weight: 600;
      color: #334155;
    }

    .register-btn {
      background: #0f766e !important;
      color: #ffffff !important;
      font-weight: 600;
      border-radius: 8px;
    }

    .user-profile-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      border-radius: 24px;
      border: 1px solid #e2e8f0;

      .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #0f766e;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
        font-weight: 700;
      }

      .user-display-name {
        font-weight: 600;
        color: #1e293b;
        max-width: 260px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .menu-user-info {
      padding: 12px 16px;

      .menu-name {
        font-weight: 700;
        color: #0f172a;
        font-size: 0.95rem;
      }

      .menu-email {
        color: #64748b;
        font-size: 0.82rem;
        margin-bottom: 6px;
      }

      .role-badge {
        display: inline-block;
        padding: 2px 8px;
        font-size: 0.7rem;
        font-weight: 700;
        border-radius: 12px;
        background: #e2e8f0;
        color: #475569;

        &.admin {
          background: #fef3c7;
          color: #92400e;
        }
      }
    }

    .logout-menu-item {
      color: #ef4444;
    }

    .admin-sub-bar {
      background: #0f172a;
      color: #ffffff;
      border-top: 1px solid #1e293b;
      padding: 6px 24px;

      .sub-bar-container {
        max-width: 1440px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: 16px;
        overflow-x: auto;

        .sub-bar-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;

          mat-icon { font-size: 16px; width: 16px; height: 16px; color: #f59e0b; }
        }

        .admin-sub-nav {
          display: flex;
          align-items: center;
          gap: 6px;

          a {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 600;
            color: #cbd5e1;
            white-space: nowrap;
            transition: all 0.2s ease;

            mat-icon { font-size: 16px; width: 16px; height: 16px; }

            &:hover {
              color: #ffffff;
              background: rgba(255, 255, 255, 0.1);
            }

            &.active-sub {
              background: #0f766e;
              color: #ffffff;
            }
          }
        }
      }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);
  wishlistService = inject(WishlistService);

  cartItemCount = computed(() => this.cartService.itemCount());
  wishlistCount = computed(() => this.wishlistService.count());

  userInitials = computed(() => {
    const name = this.authService.currentUser()?.full_name;
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  });
}
