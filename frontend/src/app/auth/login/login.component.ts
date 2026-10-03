import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { LogoComponent } from '../../shared/components/logo/logo.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    LogoComponent
  ],
  template: `
    <div class="auth-container">
      <div class="auth-card-wrapper">
        <mat-card class="auth-card">
          <div class="auth-header">
            <app-logo size="lg" [showText]="false"></app-logo>
            <h2>Welcome Back to SmartMart</h2>
            <p>Access your supermarket account, orders & fresh delivery</p>
          </div>

          <!-- Quick Test Credentials Box -->
          <div class="quick-credentials-box">
            <div class="quick-header">
              <mat-icon>bolt</mat-icon>
              <span>Quick Demo Accounts (1-Click Fill)</span>
            </div>
            <div class="quick-buttons">
              <button mat-stroked-button type="button" (click)="fillCredentials('customer@smartmart.com', 'customer123')">
                <mat-icon>person</mat-icon> Demo Customer
              </button>
              <button mat-stroked-button color="accent" type="button" (click)="fillCredentials('admin@smartmart.com', 'admin123')">
                <mat-icon>admin_panel_settings</mat-icon> Store Admin
              </button>
            </div>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email Address</mat-label>
              <input matInput type="email" formControlName="email" placeholder="name@example.com" />
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">Please enter a valid email</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" placeholder="Enter password" />
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())" [attr.aria-label]="'Hide password'">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">Password is required</mat-error>
            </mat-form-field>

            <button mat-flat-button color="primary" type="submit" class="submit-btn" [disabled]="loginForm.invalid || isLoading()">
              <mat-spinner diameter="20" *ngIf="isLoading()" class="btn-spinner"></mat-spinner>
              <span *ngIf="!isLoading()">Sign In to SmartMart</span>
            </button>
          </form>

          <div class="auth-footer">
            <p>New to SmartMart? <a routerLink="/register">Create an account</a></p>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: calc(100vh - 70px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: radial-gradient(circle at 10% 20%, rgba(15, 118, 110, 0.08) 0%, rgba(248, 250, 252, 1) 90%);
    }

    .auth-card-wrapper {
      width: 100%;
      max-width: 460px;
    }

    .auth-card {
      padding: 32px 28px;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
      background: #ffffff;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 24px;

      app-logo {
        display: inline-flex;
        margin-bottom: 14px;
      }

      h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 6px;
      }

      p {
        color: #64748b;
        font-size: 0.9rem;
      }
    }

    .quick-credentials-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 20px;

      .quick-header {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        color: #475569;
        margin-bottom: 8px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: #f59e0b;
        }
      }

      .quick-buttons {
        display: flex;
        gap: 8px;

        button {
          flex: 1;
          font-size: 0.78rem;
          height: 36px;
          line-height: 36px;
          padding: 0 10px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            margin-right: 4px;
          }
        }
      }
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .full-width {
      width: 100%;
    }

    .submit-btn {
      height: 48px;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 10px;
      margin-top: 10px;
      background-color: #0f766e !important;
      color: #ffffff !important;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      &:hover {
        background-color: #115e59 !important;
      }

      &:disabled {
        opacity: 0.65;
      }
    }

    .btn-spinner {
      margin-right: 8px;
    }

    .auth-footer {
      text-align: center;
      margin-top: 24px;
      font-size: 0.9rem;
      color: #64748b;

      a {
        color: #0f766e;
        font-weight: 600;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  hidePassword = signal(true);
  isLoading = signal(false);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  fillCredentials(email: string, pass: string) {
    this.loginForm.patchValue({ email, password: pass });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else if (res.user.role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/products']);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
