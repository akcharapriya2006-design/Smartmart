import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <div class="profile-page-container">
      <mat-card class="profile-card">
        <!-- Avatar & Header -->
        <div class="avatar-wrap">
          <div class="avatar-circle">
            <mat-icon>person</mat-icon>
          </div>
        </div>

        <div class="profile-header">
          <h1>{{ authService.currentUser()?.full_name || 'SmartMart Shopper' }}</h1>
          <p class="email-text">{{ authService.currentUser()?.email }}</p>
          <span class="role-badge" [class.admin]="authService.isAdmin()">
            {{ authService.currentUser()?.role || 'CUSTOMER' }} ACCOUNT
          </span>
        </div>

        <mat-divider></mat-divider>

        <!-- Account Details -->
        <div class="details-list">
          <div class="detail-row">
            <div class="detail-label">
              <mat-icon>badge</mat-icon>
              <span>Full Name</span>
            </div>
            <div class="detail-value">{{ authService.currentUser()?.full_name }}</div>
          </div>

          <div class="detail-row">
            <div class="detail-label">
              <mat-icon>email</mat-icon>
              <span>Email Address</span>
            </div>
            <div class="detail-value">{{ authService.currentUser()?.email }}</div>
          </div>

          <div class="detail-row" *ngIf="authService.currentUser()?.phone">
            <div class="detail-label">
              <mat-icon>phone</mat-icon>
              <span>Contact Phone</span>
            </div>
            <div class="detail-value">{{ authService.currentUser()?.phone }}</div>
          </div>

          <div class="detail-row" *ngIf="authService.currentUser()?.default_address">
            <div class="detail-label">
              <mat-icon>home</mat-icon>
              <span>Delivery Address</span>
            </div>
            <div class="detail-value">{{ authService.currentUser()?.default_address }}</div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Action Links & Logout Button -->
        <div class="actions-section">
          <div class="quick-links">
            <a mat-stroked-button routerLink="/orders" *ngIf="authService.isCustomer()">
              <mat-icon>receipt_long</mat-icon>
              <span>My Orders</span>
            </a>
            <a mat-stroked-button routerLink="/wishlist" *ngIf="authService.isCustomer()">
              <mat-icon>favorite</mat-icon>
              <span>Saved Wishlist</span>
            </a>
            <a mat-stroked-button routerLink="/admin/dashboard" *ngIf="authService.isAdmin()" color="accent">
              <mat-icon>dashboard</mat-icon>
              <span>Admin Dashboard</span>
            </a>
          </div>

          <button mat-flat-button color="warn" class="logout-btn" (click)="authService.logout()">
            <mat-icon>logout</mat-icon>
            <span>Sign Out of SmartMart</span>
          </button>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-page-container {
      max-width: 600px;
      margin: 48px auto;
      padding: 0 20px;
    }

    .profile-card {
      padding: 36px 32px;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      text-align: center;
    }

    .avatar-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 16px;

      .avatar-circle {
        width: 84px;
        height: 84px;
        border-radius: 50%;
        background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(15, 118, 110, 0.25);

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
        }
      }
    }

    .profile-header {
      margin-bottom: 24px;

      h1 {
        font-size: 1.5rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 4px;
      }

      .email-text {
        font-size: 0.95rem;
        color: #64748b;
        margin: 0 0 12px;
      }

      .role-badge {
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.8px;
        padding: 3px 12px;
        border-radius: 12px;
        background: #f1f5f9;
        color: #475569;

        &.admin {
          background: #fef3c7;
          color: #92400e;
        }
      }
    }

    .details-list {
      padding: 20px 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
      text-align: left;

      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: #f8fafc;
        border-radius: 10px;

        .detail-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748b;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            color: #0f766e;
          }
        }

        .detail-value {
          font-size: 0.92rem;
          font-weight: 700;
          color: #1e293b;
          text-align: right;
        }
      }
    }

    .actions-section {
      padding-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .quick-links {
        display: flex;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;

        a {
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.85rem;
          mat-icon { margin-right: 4px; }
        }
      }

      .logout-btn {
        width: 100%;
        height: 46px;
        border-radius: 10px;
        font-weight: 700;
        font-size: 0.95rem;

        mat-icon {
          margin-right: 6px;
        }
      }
    }
  `]
})
export class ProfileComponent {
  authService = inject(AuthService);
}
