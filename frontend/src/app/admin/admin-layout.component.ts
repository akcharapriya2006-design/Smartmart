import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { ReportService } from '../core/services/report.service';
import { LogoComponent } from '../shared/components/logo/logo.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule,
    LogoComponent
  ],
  template: `
    <div class="admin-shell">
      <!-- Admin Sidebar -->
      <aside class="admin-sidebar" [class.collapsed]="sidebarCollapsed()">
        <!-- Brand / Header -->
        <div class="sidebar-header">
          <div class="brand-box">
            <app-logo 
              size="md" 
              [showText]="!sidebarCollapsed()" 
              tagline="Admin Portal" 
              variant="admin">
            </app-logo>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Navigation Links -->
        <nav class="admin-nav-menu">
          <a 
            routerLink="/admin/dashboard" 
            routerLinkActive="active-nav-link"
            class="nav-item"
            [matTooltip]="sidebarCollapsed() ? 'Dashboard' : ''"
            matTooltipPosition="right">
            <mat-icon>dashboard</mat-icon>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Dashboard</span>
          </a>

          <a 
            routerLink="/admin/products" 
            routerLinkActive="active-nav-link"
            class="nav-item"
            [matTooltip]="sidebarCollapsed() ? 'Products' : ''"
            matTooltipPosition="right">
            <mat-icon>inventory_2</mat-icon>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Products</span>
          </a>

          <a 
            routerLink="/admin/categories" 
            routerLinkActive="active-nav-link"
            class="nav-item"
            [matTooltip]="sidebarCollapsed() ? 'Categories' : ''"
            matTooltipPosition="right">
            <mat-icon>category</mat-icon>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Categories</span>
          </a>

          <a 
            routerLink="/admin/inventory" 
            routerLinkActive="active-nav-link"
            class="nav-item"
            [matTooltip]="sidebarCollapsed() ? 'Inventory' : ''"
            matTooltipPosition="right">
            <mat-icon [matBadge]="lowStockCount()" [matBadgeHidden]="lowStockCount() === 0" matBadgeColor="warn">
              add_business
            </mat-icon>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Inventory</span>
          </a>

          <a 
            routerLink="/admin/orders" 
            routerLinkActive="active-nav-link"
            class="nav-item"
            [matTooltip]="sidebarCollapsed() ? 'Orders' : ''"
            matTooltipPosition="right">
            <mat-icon>receipt_long</mat-icon>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Orders</span>
          </a>

          <a 
            routerLink="/admin/customers" 
            routerLinkActive="active-nav-link"
            class="nav-item"
            [matTooltip]="sidebarCollapsed() ? 'Customers' : ''"
            matTooltipPosition="right">
            <mat-icon>group</mat-icon>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Customers</span>
          </a>

          <a 
            routerLink="/admin/reports" 
            routerLinkActive="active-nav-link"
            class="nav-item"
            [matTooltip]="sidebarCollapsed() ? 'Reports' : ''"
            matTooltipPosition="right">
            <mat-icon>analytics</mat-icon>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Reports</span>
          </a>
        </nav>

        <!-- Sidebar Bottom: Storefront Link -->
        <div class="sidebar-footer">
          <mat-divider></mat-divider>
          <a 
            routerLink="/products" 
            class="storefront-link"
            [matTooltip]="sidebarCollapsed() ? 'View Customer Storefront' : ''"
            matTooltipPosition="right">
            <mat-icon>storefront</mat-icon>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Customer Store</span>
          </a>
        </div>
      </aside>

      <!-- Main Admin Body -->
      <div class="admin-main-wrapper">
        <!-- Top Toolbar -->
        <header class="admin-topbar">
          <div class="topbar-left">
            <button mat-icon-button (click)="toggleSidebar()" matTooltip="Toggle Sidebar" class="toggle-btn">
              <mat-icon>{{ sidebarCollapsed() ? 'menu_open' : 'menu' }}</mat-icon>
            </button>
            <div class="page-context">
              <span class="portal-tag">SmartMart Supermarket Control Center</span>
            </div>
          </div>

          <div class="topbar-right">
            <!-- Admin Profile Details -->
            <div class="admin-user-pill">
              <div class="admin-avatar">
                {{ userInitials() }}
              </div>
              <div class="admin-meta">
                <span class="admin-name">{{ authService.currentUser()?.full_name || 'Administrator' }}</span>
                <span class="admin-role-badge">Super Admin</span>
              </div>
            </div>

            <!-- Logout Button -->
            <button mat-flat-button color="warn" class="admin-logout-btn" (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Logout</span>
            </button>
          </div>
        </header>

        <!-- Admin Content Outlet -->
        <main class="admin-content-area">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .admin-shell {
      display: flex;
      min-height: 100vh;
      background-color: #f1f5f9;
      color: #1e293b;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    /* Sidebar Styles */
    .admin-sidebar {
      width: 250px;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      flex-shrink: 0;
      position: sticky;
      top: 0;
      height: 100vh;
      z-index: 100;
      box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);

      &.collapsed {
        width: 72px;

        .sidebar-header {
          padding: 16px 8px;
          justify-content: center;
        }

        .nav-item {
          justify-content: center;
          padding: 14px 0;
        }

        .storefront-link {
          justify-content: center;
          padding: 12px 0;
        }
      }

      .sidebar-header {
        padding: 20px 18px;
        display: flex;
        align-items: center;

        .brand-box {
          display: flex;
          align-items: center;
          width: 100%;
          overflow: hidden;
        }
      }

      mat-divider {
        border-color: rgba(255, 255, 255, 0.08);
      }

      .admin-nav-menu {
        flex: 1;
        padding: 16px 10px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        overflow-y: auto;

        .nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 11px 14px;
          border-radius: 10px;
          color: #94a3b8;
          text-decoration: none;
          font-size: 0.92rem;
          font-weight: 600;
          transition: all 0.2s ease;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
            color: #64748b;
            transition: color 0.2s ease;
          }

          &:hover {
            background: rgba(255, 255, 255, 0.06);
            color: #ffffff;

            mat-icon {
              color: #2dd4bf;
            }
          }

          &.active-nav-link {
            background: linear-gradient(90deg, #0d9488 0%, #0f766e 100%);
            color: #ffffff;
            font-weight: 700;
            box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);

            mat-icon {
              color: #ffffff;
            }
          }
        }
      }

      .sidebar-footer {
        padding: 12px 10px 18px;

        .storefront-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 10px;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.08);
          text-decoration: none;
          font-size: 0.88rem;
          font-weight: 600;
          transition: all 0.2s ease;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }

          &:hover {
            background: rgba(56, 189, 248, 0.18);
            color: #7dd3fc;
          }
        }
      }
    }

    /* Main Area Styles */
    .admin-main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .admin-topbar {
      height: 64px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 90;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);

      .topbar-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .toggle-btn {
          color: #475569;
        }

        .portal-tag {
          font-size: 0.92rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.2px;
        }
      }

      .topbar-right {
        display: flex;
        align-items: center;
        gap: 18px;

        .admin-user-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f8fafc;
          padding: 4px 12px 4px 6px;
          border-radius: 30px;
          border: 1px solid #e2e8f0;

          .admin-avatar {
            width: 32px;
            height: 32px;
            background: #0f766e;
            color: #ffffff;
            font-weight: 700;
            font-size: 0.8rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .admin-meta {
            display: flex;
            flex-direction: column;

            .admin-name {
              font-size: 0.85rem;
              font-weight: 700;
              color: #0f172a;
              line-height: 1.2;
            }

            .admin-role-badge {
              font-size: 0.68rem;
              font-weight: 700;
              color: #0d9488;
              text-transform: uppercase;
              letter-spacing: 0.4px;
            }
          }
        }

        .admin-logout-btn {
          background-color: #fee2e2 !important;
          color: #b91c1c !important;
          font-weight: 700;
          border-radius: 8px;
          height: 38px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          gap: 6px;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }

          &:hover {
            background-color: #fecaca !important;
          }
        }
      }
    }

    .admin-content-area {
      flex: 1;
      padding-bottom: 40px;
    }
  `]
})
export class AdminLayoutComponent {
  authService = inject(AuthService);
  reportService = inject(ReportService);
  private router = inject(Router);

  sidebarCollapsed = signal(false);

  lowStockCount = () => this.reportService.summary()?.low_stock_count || 0;

  userInitials(): string {
    const user = this.authService.currentUser();
    if (!user || !user.full_name) return 'AD';
    return user.full_name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
