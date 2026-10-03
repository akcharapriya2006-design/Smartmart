import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { Order, OrderType, PaymentMethod } from '../../core/models/order.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatStepperModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="checkout-page-container">
      <div class="checkout-header" *ngIf="!confirmedOrder()">
        <h1>Supermarket Checkout</h1>
        <p>Complete your delivery and simulated payment in 3 quick steps.</p>
      </div>

      <!-- Stepper when order not yet confirmed -->
      <div class="checkout-layout" *ngIf="!confirmedOrder()">
        <mat-card class="stepper-card">
          <mat-stepper linear #stepper class="custom-stepper">
            <!-- STEP 1: FULFILLMENT MODE -->
            <mat-step [stepControl]="deliveryForm">
              <form [formGroup]="deliveryForm">
                <ng-template matStepLabel>Delivery Option</ng-template>

                <div class="step-content">
                  <h3>Choose How You Want Your Groceries</h3>

                  <mat-radio-group formControlName="order_type" class="radio-cards-group">
                    <div class="radio-card" [class.selected]="deliveryForm.get('order_type')?.value === 'HOME_DELIVERY'">
                      <mat-radio-button value="HOME_DELIVERY">
                        <div class="radio-label-content">
                          <div class="radio-title-row">
                            <mat-icon class="mode-icon">local_shipping</mat-icon>
                            <span class="mode-name">Home Delivery</span>
                            <span class="fee-chip" *ngIf="cartService.deliveryFee() === 0">FREE</span>
                            <span class="fee-chip paid" *ngIf="cartService.deliveryFee() > 0">\${{ cartService.deliveryFee() | number:'1.2-2' }}</span>
                          </div>
                          <p class="mode-desc">Delivered to your doorstep within 45-60 minutes in temperature-controlled bags.</p>
                        </div>
                      </mat-radio-button>
                    </div>

                    <div class="radio-card" [class.selected]="deliveryForm.get('order_type')?.value === 'STORE_PICKUP'">
                      <mat-radio-button value="STORE_PICKUP">
                        <div class="radio-label-content">
                          <div class="radio-title-row">
                            <mat-icon class="mode-icon">store</mat-icon>
                            <span class="mode-name">Express Store Pickup</span>
                            <span class="fee-chip">FREE</span>
                          </div>
                          <p class="mode-desc">Packed and ready for pickup at our dedicated express grocery counter.</p>
                        </div>
                      </mat-radio-button>
                    </div>
                  </mat-radio-group>

                  <!-- Home Delivery Fields -->
                  <div class="delivery-details-box" *ngIf="deliveryForm.get('order_type')?.value === 'HOME_DELIVERY'">
                    <h4>Delivery Location</h4>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Street Address, Apartment / Suite</mat-label>
                      <textarea matInput rows="3" formControlName="delivery_address" placeholder="123 Market St, Apt 4B, Springfield"></textarea>
                      <mat-icon matPrefix>home</mat-icon>
                      <mat-error *ngIf="deliveryForm.get('delivery_address')?.hasError('required')">Delivery address is required</mat-error>
                    </mat-form-field>
                  </div>

                  <!-- Store Pickup Fields -->
                  <div class="delivery-details-box" *ngIf="deliveryForm.get('order_type')?.value === 'STORE_PICKUP'">
                    <h4>Select Pickup Window</h4>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Pickup Time Slot</mat-label>
                      <mat-select formControlName="pickup_time_slot">
                        <mat-option value="Today: 2:00 PM - 4:00 PM">Today: 2:00 PM - 4:00 PM</mat-option>
                        <mat-option value="Today: 4:00 PM - 6:00 PM">Today: 4:00 PM - 6:00 PM</mat-option>
                        <mat-option value="Today: 6:00 PM - 8:00 PM">Today: 6:00 PM - 8:00 PM</mat-option>
                        <mat-option value="Tomorrow: 10:00 AM - 12:00 PM">Tomorrow: 10:00 AM - 12:00 PM</mat-option>
                        <mat-option value="Tomorrow: 2:00 PM - 4:00 PM">Tomorrow: 2:00 PM - 4:00 PM</mat-option>
                      </mat-select>
                      <mat-icon matPrefix>schedule</mat-icon>
                    </mat-form-field>
                  </div>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Special Instructions / Notes (Optional)</mat-label>
                    <input matInput formControlName="notes" placeholder="e.g. Ring doorbell, leave at front porch" />
                    <mat-icon matPrefix>note_alt</mat-icon>
                  </mat-form-field>

                  <div class="step-actions">
                    <button mat-flat-button color="primary" matStepperNext [disabled]="deliveryForm.invalid">
                      Continue to Payment <mat-icon>arrow_forward</mat-icon>
                    </button>
                  </div>
                </div>
              </form>
            </mat-step>

            <!-- STEP 2: SIMULATED PAYMENT -->
            <mat-step [stepControl]="paymentForm">
              <form [formGroup]="paymentForm">
                <ng-template matStepLabel>Payment Method</ng-template>

                <div class="step-content">
                  <h3>Select Simulated Payment Option</h3>

                  <mat-radio-group formControlName="payment_method" class="radio-cards-group">
                    <!-- Simulated Card -->
                    <div class="radio-card" [class.selected]="paymentForm.get('payment_method')?.value === 'SIMULATED_CARD'">
                      <mat-radio-button value="SIMULATED_CARD">
                        <div class="radio-label-content">
                          <div class="radio-title-row">
                            <mat-icon class="mode-icon">credit_card</mat-icon>
                            <span class="mode-name">Credit or Debit Card (Simulated)</span>
                          </div>
                          <p class="mode-desc">Simulated card gateway with test card pre-fills.</p>
                        </div>
                      </mat-radio-button>
                    </div>

                    <!-- Simulated UPI -->
                    <div class="radio-card" [class.selected]="paymentForm.get('payment_method')?.value === 'SIMULATED_UPI'">
                      <mat-radio-button value="SIMULATED_UPI">
                        <div class="radio-label-content">
                          <div class="radio-title-row">
                            <mat-icon class="mode-icon">qr_code_2</mat-icon>
                            <span class="mode-name">Instant UPI / QR (Simulated)</span>
                          </div>
                          <p class="mode-desc">Pay directly via simulated UPI ID.</p>
                        </div>
                      </mat-radio-button>
                    </div>

                    <!-- Cash on Delivery/Pickup -->
                    <div class="radio-card" [class.selected]="paymentForm.get('payment_method')?.value === 'CASH_ON_DELIVERY'">
                      <mat-radio-button value="CASH_ON_DELIVERY">
                        <div class="radio-label-content">
                          <div class="radio-title-row">
                            <mat-icon class="mode-icon">payments</mat-icon>
                            <span class="mode-name">
                              {{ deliveryForm.get('order_type')?.value === 'STORE_PICKUP' ? 'Pay at Store Counter' : 'Cash on Delivery (COD)' }}
                            </span>
                          </div>
                          <p class="mode-desc">Pay with cash or card upon delivery or store pickup.</p>
                        </div>
                      </mat-radio-button>
                    </div>
                  </mat-radio-group>

                  <!-- Card Inputs -->
                  <div class="payment-details-box" *ngIf="paymentForm.get('payment_method')?.value === 'SIMULATED_CARD'">
                    <div class="quick-fill-row">
                      <span>Quick Test Cards:</span>
                      <button mat-stroked-button type="button" (click)="fillTestCard('4111 2222 3333 4444', '12/28', '123')">
                        Visa (Success)
                      </button>
                      <button mat-stroked-button type="button" (click)="fillTestCard('5555 4444 3333 2222', '09/29', '456')">
                        Mastercard (Success)
                      </button>
                    </div>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Card Number</mat-label>
                      <input matInput formControlName="card_number" placeholder="4111 2222 3333 4444" />
                      <mat-icon matPrefix>credit_card</mat-icon>
                    </mat-form-field>

                    <div class="form-row">
                      <mat-form-field appearance="outline" class="half-width">
                        <mat-label>Expiration (MM/YY)</mat-label>
                        <input matInput formControlName="card_exp" placeholder="12/28" />
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="half-width">
                        <mat-label>CVV Security Code</mat-label>
                        <input matInput formControlName="card_cvv" placeholder="123" />
                      </mat-form-field>
                    </div>
                  </div>

                  <!-- UPI Input -->
                  <div class="payment-details-box" *ngIf="paymentForm.get('payment_method')?.value === 'SIMULATED_UPI'">
                    <div class="quick-fill-row">
                      <span>Quick UPI:</span>
                      <button mat-stroked-button type="button" (click)="fillTestUpi('alex@okaxis')">
                        alex&#64;okaxis
                      </button>
                      <button mat-stroked-button type="button" (click)="fillTestUpi('smartmart@upi')">
                        smartmart&#64;upi
                      </button>
                    </div>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Virtual Payment Address (UPI ID)</mat-label>
                      <input matInput formControlName="upi_id" placeholder="username@bank" />
                      <mat-icon matPrefix>alternate_email</mat-icon>
                    </mat-form-field>
                  </div>

                  <div class="step-actions">
                    <button mat-button matStepperPrevious>
                      <mat-icon>arrow_back</mat-icon> Back
                    </button>
                    <button mat-flat-button color="primary" matStepperNext>
                      Review Order <mat-icon>arrow_forward</mat-icon>
                    </button>
                  </div>
                </div>
              </form>
            </mat-step>

            <!-- STEP 3: ORDER REVIEW -->
            <mat-step>
              <ng-template matStepLabel>Review & Confirm</ng-template>

              <div class="step-content">
                <h3>Final Order Verification</h3>

                <div class="review-box">
                  <div class="review-section">
                    <h4>Fulfillment</h4>
                    <p class="highlight-text">
                      {{ deliveryForm.get('order_type')?.value === 'HOME_DELIVERY' ? 'Home Delivery' : 'Express Store Pickup' }}
                    </p>
                    <p class="sub-text" *ngIf="deliveryForm.get('order_type')?.value === 'HOME_DELIVERY'">
                      {{ deliveryForm.get('delivery_address')?.value }}
                    </p>
                    <p class="sub-text" *ngIf="deliveryForm.get('order_type')?.value === 'STORE_PICKUP'">
                      {{ deliveryForm.get('pickup_time_slot')?.value }}
                    </p>
                  </div>

                  <div class="review-section">
                    <h4>Payment Method</h4>
                    <p class="highlight-text">{{ paymentMethodLabel() }}</p>
                    <p class="sub-text">Simulated transaction will be verified upon placement.</p>
                  </div>
                </div>

                <div class="step-actions">
                  <button mat-button matStepperPrevious>
                    <mat-icon>arrow_back</mat-icon> Back
                  </button>
                  <button mat-flat-button color="primary" class="place-order-btn" (click)="onPlaceOrder()" [disabled]="isSubmitting()">
                    <mat-spinner diameter="20" *ngIf="isSubmitting()"></mat-spinner>
                    <mat-icon *ngIf="!isSubmitting()">check_circle</mat-icon>
                    <span *ngIf="!isSubmitting()">Place Supermarket Order (\${{ cartService.total() | number:'1.2-2' }})</span>
                  </button>
                </div>
              </div>
            </mat-step>
          </mat-stepper>
        </mat-card>

        <!-- Right Cart Summary -->
        <mat-card class="mini-summary-card">
          <h3>Basket Items ({{ cartService.itemCount() }})</h3>
          <mat-divider></mat-divider>

          <div class="mini-items-list">
            <div *ngFor="let item of cartService.items()" class="mini-item">
              <span class="m-qty">{{ item.quantity }}x</span>
              <span class="m-name" [title]="item.product_name">{{ item.product_name }}</span>
              <span class="m-price">\${{ item.total_price | number:'1.2-2' }}</span>
            </div>
          </div>

          <mat-divider></mat-divider>

          <div class="mini-totals">
            <div class="m-row">
              <span>Subtotal</span>
              <span>\${{ cartService.subtotal() | number:'1.2-2' }}</span>
            </div>
            <div class="m-row">
              <span>Sales Tax (8%)</span>
              <span>\${{ cartService.tax() | number:'1.2-2' }}</span>
            </div>
            <div class="m-row">
              <span>Delivery Fee</span>
              <span *ngIf="cartService.deliveryFee() > 0">\${{ cartService.deliveryFee() | number:'1.2-2' }}</span>
              <span *ngIf="cartService.deliveryFee() === 0" class="free-pill">FREE</span>
            </div>
            <div class="m-row total">
              <span>Total Due</span>
              <span class="tot-price">\${{ cartService.total() | number:'1.2-2' }}</span>
            </div>
          </div>
        </mat-card>
      </div>

      <!-- Order Confirmation View -->
      <div class="success-screen" *ngIf="confirmedOrder()">
        <mat-card class="success-card">
          <div class="check-icon-wrap">
            <mat-icon>check</mat-icon>
          </div>

          <h2>Thank You For Your Order!</h2>
          <p class="order-num-pill">Order #{{ confirmedOrder()?.order_number }}</p>
          <p class="success-desc">
            Your supermarket order has been received and confirmed. Our team is hand-picking your items for optimal freshness.
          </p>

          <div class="order-summary-box">
            <div class="os-row">
              <span>Fulfillment:</span>
              <strong>{{ confirmedOrder()?.order_type === 'HOME_DELIVERY' ? 'Home Delivery' : 'Express Store Pickup' }}</strong>
            </div>
            <div class="os-row" *ngIf="confirmedOrder()?.order_type === 'HOME_DELIVERY'">
              <span>Deliver To:</span>
              <strong>{{ confirmedOrder()?.delivery_address }}</strong>
            </div>
            <div class="os-row" *ngIf="confirmedOrder()?.order_type === 'STORE_PICKUP'">
              <span>Pickup Slot:</span>
              <strong>{{ confirmedOrder()?.pickup_time_slot }}</strong>
            </div>
            <div class="os-row">
              <span>Payment Status:</span>
              <strong class="paid-badge">{{ confirmedOrder()?.payment_status }}</strong>
            </div>
            <div class="os-row">
              <span>Payment Ref:</span>
              <code>{{ confirmedOrder()?.payment_reference }}</code>
            </div>
            <div class="os-row total">
              <span>Total Amount:</span>
              <strong class="total-bold">\${{ confirmedOrder()?.total_amount | number:'1.2-2' }}</strong>
            </div>
          </div>

          <div class="success-actions">
            <button mat-flat-button color="primary" routerLink="/orders" class="view-orders-btn">
              <mat-icon>receipt_long</mat-icon> View In My Orders
            </button>
            <button mat-stroked-button routerLink="/products">
              <mat-icon>storefront</mat-icon> Continue Shopping
            </button>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .checkout-page-container {
      max-width: 1250px;
      margin: 32px auto;
      padding: 0 20px;
    }

    .checkout-header {
      margin-bottom: 24px;
      h1 { font-size: 1.8rem; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
      p { color: #64748b; font-size: 0.95rem; }
    }

    .checkout-layout {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 28px;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }

    .stepper-card {
      padding: 24px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
    }

    .step-content {
      padding: 16px 8px;

      h3 {
        font-size: 1.2rem;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 18px;
      }
    }

    .radio-cards-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;

      .radio-card {
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        padding: 14px 18px;
        transition: all 0.2s ease;

        &.selected {
          border-color: #0f766e;
          background: #f0fdfa;
        }

        .radio-label-content {
          margin-left: 8px;

          .radio-title-row {
            display: flex;
            align-items: center;
            gap: 10px;

            .mode-icon {
              color: #0f766e;
              font-size: 20px;
              width: 20px;
              height: 20px;
            }

            .mode-name {
              font-size: 1rem;
              font-weight: 700;
              color: #0f172a;
            }

            .fee-chip {
              background: #dcfce7;
              color: #15803d;
              font-size: 0.72rem;
              font-weight: 700;
              padding: 2px 8px;
              border-radius: 10px;

              &.paid {
                background: #f1f5f9;
                color: #475569;
              }
            }
          }

          .mode-desc {
            color: #64748b;
            font-size: 0.85rem;
            margin: 4px 0 0 30px;
          }
        }
      }
    }

    .delivery-details-box, .payment-details-box {
      background: #f8fafc;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;

      h4 {
        font-size: 0.95rem;
        font-weight: 700;
        color: #334155;
        margin-bottom: 14px;
      }
    }

    .quick-fill-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-size: 0.82rem;
      color: #64748b;
      flex-wrap: wrap;

      button {
        font-size: 0.78rem;
        height: 32px;
        line-height: 32px;
      }
    }

    .form-row {
      display: flex;
      gap: 12px;
    }
    .full-width { width: 100%; }
    .half-width { flex: 1; }

    .step-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;

      button[color="primary"] {
        background-color: #0f766e !important;
        color: #ffffff !important;
      }
    }

    .review-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: #f8fafc;
      border-radius: 12px;
      padding: 18px;
      border: 1px solid #e2e8f0;
      margin-bottom: 24px;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }

      .review-section {
        h4 { font-size: 0.8rem; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
        .highlight-text { font-size: 1rem; font-weight: 700; color: #0f766e; margin-bottom: 2px; }
        .sub-text { font-size: 0.85rem; color: #475569; }
      }
    }

    .place-order-btn {
      height: 48px;
      font-size: 1rem;
      font-weight: 700;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .mini-summary-card {
      padding: 24px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      height: fit-content;

      h3 { font-size: 1.15rem; font-weight: 700; margin-bottom: 12px; }

      .mini-items-list {
        margin: 12px 0;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .mini-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.88rem;

          .m-qty { font-weight: 700; color: #0f766e; min-width: 24px; padding-top: 1px; }
          .m-name { flex: 1; color: #334155; line-height: 1.35; word-break: break-word; }
          .m-price { font-weight: 700; color: #0f172a; white-space: nowrap; padding-top: 1px; }
        }
      }

      .mini-totals {
        margin-top: 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .m-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.88rem;
          color: #64748b;

          .free-pill { color: #10b981; font-weight: 700; }

          &.total {
            padding-top: 8px;
            font-size: 1.1rem;
            font-weight: 700;
            color: #0f172a;

            .tot-price { color: #0f766e; font-size: 1.3rem; font-weight: 800; }
          }
        }
      }
    }

    .success-screen {
      display: flex;
      justify-content: center;
      padding: 40px 0;

      .success-card {
        padding: 40px 32px;
        border-radius: 20px;
        border: 1px solid #e2e8f0;
        max-width: 580px;
        width: 100%;
        text-align: center;

        .check-icon-wrap {
          width: 72px;
          height: 72px;
          background: #dcfce7;
          color: #15803d;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;

          mat-icon { font-size: 40px; width: 40px; height: 40px; }
        }

        h2 { font-size: 1.7rem; font-weight: 800; color: #0f172a; margin-bottom: 6px; }

        .order-num-pill {
          display: inline-block;
          background: #f0fdfa;
          color: #0f766e;
          font-weight: 700;
          font-size: 1rem;
          padding: 4px 16px;
          border-radius: 20px;
          margin-bottom: 12px;
        }

        .success-desc {
          color: #64748b;
          font-size: 0.95rem;
          margin-bottom: 24px;
        }

        .order-summary-box {
          background: #f8fafc;
          border-radius: 12px;
          padding: 18px 24px;
          border: 1px solid #e2e8f0;
          margin-bottom: 28px;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 10px;

          .os-row {
            display: flex;
            justify-content: space-between;
            font-size: 0.9rem;
            color: #475569;

            strong { color: #1e293b; }
            .paid-badge { color: #15803d; font-weight: 800; }
            code { font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; }

            &.total {
              padding-top: 10px;
              border-top: 1px solid #e2e8f0;
              font-size: 1.05rem;
              .total-bold { color: #0f766e; font-size: 1.25rem; font-weight: 800; }
            }
          }
        }

        .success-actions {
          display: flex;
          justify-content: center;
          gap: 12px;

          .view-orders-btn {
            background-color: #0f766e !important;
            color: #ffffff !important;
            height: 46px;
          }
        }
      }
    }
  `]
})
export class CheckoutComponent implements OnInit {
  cartService = inject(CartService);
  authService = inject(AuthService);
  private orderService = inject(OrderService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  isSubmitting = signal(false);
  confirmedOrder = signal<Order | null>(null);

  deliveryForm: FormGroup = this.fb.group({
    order_type: ['HOME_DELIVERY', [Validators.required]],
    delivery_address: ['', [Validators.required]],
    pickup_time_slot: ['Today: 4:00 PM - 6:00 PM'],
    notes: ['']
  });

  paymentForm: FormGroup = this.fb.group({
    payment_method: ['SIMULATED_CARD', [Validators.required]],
    card_number: ['4111 2222 3333 4444'],
    card_exp: ['12/28'],
    card_cvv: ['123'],
    upi_id: ['alex@okaxis']
  });

  ngOnInit() {
    this.cartService.loadCart().subscribe();

    // Pre-fill user address
    const user = this.authService.currentUser();
    if (user?.default_address) {
      this.deliveryForm.patchValue({ delivery_address: user.default_address });
    }

    // React to order_type switch
    this.deliveryForm.get('order_type')?.valueChanges.subscribe((type) => {
      const addrControl = this.deliveryForm.get('delivery_address');
      if (type === 'HOME_DELIVERY') {
        addrControl?.setValidators([Validators.required]);
      } else {
        addrControl?.clearValidators();
      }
      addrControl?.updateValueAndValidity();
    });
  }

  fillTestCard(card: string, exp: string, cvv: string) {
    this.paymentForm.patchValue({ card_number: card, card_exp: exp, card_cvv: cvv });
  }

  fillTestUpi(upi: string) {
    this.paymentForm.patchValue({ upi_id: upi });
  }

  paymentMethodLabel(): string {
    const method = this.paymentForm.get('payment_method')?.value;
    if (method === 'SIMULATED_CARD') return 'Simulated Credit/Debit Card';
    if (method === 'SIMULATED_UPI') return 'Simulated UPI';
    return this.deliveryForm.get('order_type')?.value === 'STORE_PICKUP' ? 'Pay at Counter' : 'Cash on Delivery';
  }

  onPlaceOrder() {
    this.isSubmitting.set(true);

    const deliveryVals = this.deliveryForm.value;
    const paymentVals = this.paymentForm.value;

    const payload: any = {
      order_type: deliveryVals.order_type,
      delivery_address: deliveryVals.delivery_address,
      pickup_time_slot: deliveryVals.pickup_time_slot,
      notes: deliveryVals.notes,
      payment_method: paymentVals.payment_method,
      payment_details: {
        card_number: paymentVals.card_number,
        card_exp: paymentVals.card_exp,
        card_cvv: paymentVals.card_cvv,
        upi_id: paymentVals.upi_id
      }
    };

    this.orderService.checkout(payload).subscribe({
      next: (order) => {
        this.isSubmitting.set(false);
        this.confirmedOrder.set(order);
        this.cartService.loadCart().subscribe();
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }
}
