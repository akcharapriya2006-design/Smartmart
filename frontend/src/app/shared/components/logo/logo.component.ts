import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="smartmart-logo" [ngClass]="['size-' + size, variant]">
      <div class="logo-mark">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" class="basket-svg">
          <!-- Fresh Grocery Leaf Sprout -->
          <path d="M20 12C20 6.5 25 5 26.5 5C26.5 10.5 22.5 12 20 12Z" fill="#10b981"/>
          <!-- Basket Arched Handle -->
          <path d="M14 16V10.5C14 7.46 16.46 5 19.5 5H20.5C23.54 5 26 7.46 26 10.5V16" stroke="#0f766e" stroke-width="2.5" stroke-linecap="round"/>
          <!-- Sturdy Basket Rim -->
          <rect x="5" y="15" width="30" height="4" rx="2" fill="#0f766e"/>
          <!-- Market Basket Body -->
          <path d="M8 19L10.5 32.2C10.8 33.8 12.2 35 13.8 35H26.2C27.8 35 29.2 33.8 29.5 32.2L32 19H8Z" fill="#e6f7f5" stroke="#0f766e" stroke-width="2.5" stroke-linejoin="round"/>
          <!-- Slats -->
          <path d="M15 21V33M20 21V33M25 21V33" stroke="#0f766e" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>

      <div class="logo-text" *ngIf="showText">
        <div class="brand-title">
          <span class="smart-part">Smart</span><span class="mart-part">Mart</span>
        </div>
        <span class="brand-tagline" *ngIf="tagline">{{ tagline }}</span>
      </div>
    </div>
  `,
  styles: [`
    .smartmart-logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      user-select: none;

      .logo-mark {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        background: #f0fdfa;
        border: 1.5px solid #ccfbf1;
        border-radius: 10px;
        padding: 4px;
        flex-shrink: 0;

        .basket-svg {
          width: 100%;
          height: 100%;
          display: block;
        }
      }

      .logo-text {
        display: flex;
        flex-direction: column;
        line-height: 1;

        .brand-title {
          font-family: inherit;
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.4px;

          .smart-part {
            color: #0f172a;
          }

          .mart-part {
            color: #0f766e;
          }
        }

        .brand-tagline {
          font-size: 0.68rem;
          font-weight: 700;
          color: #0f766e;
          text-transform: uppercase;
          letter-spacing: 0.9px;
          margin-top: 3px;
        }
      }

      /* Size variants */
      &.size-sm {
        gap: 8px;

        .logo-mark {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          padding: 3px;
        }

        .logo-text .brand-title {
          font-size: 1.1rem;
        }

        .logo-text .brand-tagline {
          font-size: 0.6rem;
          letter-spacing: 0.6px;
        }
      }

      &.size-lg {
        gap: 12px;

        .logo-mark {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          padding: 6px;
          border-width: 2px;
        }

        .logo-text .brand-title {
          font-size: 1.7rem;
        }

        .logo-text .brand-tagline {
          font-size: 0.75rem;
          letter-spacing: 1px;
        }
      }

      /* Admin style variant */
      &.admin {
        .logo-mark {
          background: #1e293b;
          border-color: #334155;

          .basket-svg {
            path[stroke="#0f766e"] { stroke: #14b8a6; }
            rect[fill="#0f766e"] { fill: #14b8a6; }
            path[fill="#e6f7f5"] { fill: rgba(20, 184, 166, 0.15); stroke: #14b8a6; }
          }
        }

        .logo-text .brand-title .smart-part {
          color: #ffffff;
        }

        .logo-text .brand-title .mart-part {
          color: #14b8a6;
        }

        .logo-text .brand-tagline {
          color: #94a3b8;
          font-weight: 600;
        }
      }
    }
  `]
})
export class LogoComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() showText = true;
  @Input() tagline: string | null = 'Fresh Supermarket';
  @Input() variant: 'standard' | 'admin' = 'standard';
}
