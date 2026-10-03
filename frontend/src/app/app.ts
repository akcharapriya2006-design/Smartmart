import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  template: `
    <div class="app-layout" [class.in-admin]="isAdminRoute()">
      <app-navbar *ngIf="!isAdminRoute()"></app-navbar>
      <main class="main-content" [class.admin-main]="isAdminRoute()">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .main-content {
      flex: 1;
    }
    .admin-main {
      padding: 0;
      margin: 0;
      min-height: 100vh;
    }
  `]
})
export class App {
  private router = inject(Router);
  isAdminRoute = signal(typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((event) => {
      const url = event.urlAfterRedirects || event.url;
      this.isAdminRoute.set(url.startsWith('/admin'));
    });
  }
}
