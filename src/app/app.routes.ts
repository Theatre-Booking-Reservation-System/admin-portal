import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Auth pages live OUTSIDE the shell (no sidebar/topbar).
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },

  // Authenticated app inside the shell layout.
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'productions',
        loadComponent: () =>
          import('./features/productions/productions.component').then((m) => m.ProductionsComponent),
      },
      {
        path: 'productions/new',
        loadComponent: () =>
          import('./features/productions/production-form/production-form.component').then(
            (m) => m.ProductionFormComponent,
          ),
      },
      {
        path: 'productions/:id/edit',
        loadComponent: () =>
          import('./features/productions/production-form/production-form.component').then(
            (m) => m.ProductionFormComponent,
          ),
      },
      {
        path: 'productions/:id',
        loadComponent: () =>
          import('./features/productions/production-view/production-view.component').then(
            (m) => m.ProductionViewComponent,
          ),
      },
      {
        path: 'performances',
        loadComponent: () =>
          import('./features/performances/performances.component').then((m) => m.PerformancesComponent),
      },
      {
        path: 'performances/new',
        loadComponent: () =>
          import('./features/performances/performance-form/performance-form.component').then(
            (m) => m.PerformanceFormComponent,
          ),
      },
      {
        path: 'performances/:id/edit',
        loadComponent: () =>
          import('./features/performances/performance-form/performance-form.component').then(
            (m) => m.PerformanceFormComponent,
          ),
      },
      {
        path: 'performances/:id',
        loadComponent: () =>
          import('./features/performances/performance-view/performance-view.component').then(
            (m) => m.PerformanceViewComponent,
          ),
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./features/bookings/bookings.component').then((m) => m.BookingsComponent),
      },
      {
        path: 'bookings/new',
        loadComponent: () =>
          import('./features/bookings/booking-form/booking-form.component').then(
            (m) => m.BookingFormComponent,
          ),
      },
      {
        path: 'bookings/:id/edit',
        loadComponent: () =>
          import('./features/bookings/booking-form/booking-form.component').then(
            (m) => m.BookingFormComponent,
          ),
      },
      {
        path: 'bookings/:id',
        loadComponent: () =>
          import('./features/bookings/booking-view/booking-view.component').then(
            (m) => m.BookingViewComponent,
          ),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/customers/customers.component').then((m) => m.CustomersComponent),
      },
      {
        path: 'customers/:id',
        loadComponent: () =>
          import('./features/customers/customer-view/customer-view.component').then(
            (m) => m.CustomerViewComponent,
          ),
      },
      {
        path: 'concessions',
        loadComponent: () =>
          import('./features/concessions/concessions.component').then((m) => m.ConcessionsComponent),
      },
      {
        path: 'concessions/new',
        loadComponent: () =>
          import('./features/concessions/concession-form/concession-form.component').then(
            (m) => m.ConcessionFormComponent,
          ),
      },
      {
        path: 'concessions/:id/edit',
        loadComponent: () =>
          import('./features/concessions/concession-form/concession-form.component').then(
            (m) => m.ConcessionFormComponent,
          ),
      },
      {
        path: 'concessions/:id',
        loadComponent: () =>
          import('./features/concessions/concession-view/concession-view.component').then(
            (m) => m.ConcessionViewComponent,
          ),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/payments/payments.component').then((m) => m.PaymentsComponent),
      },
      {
        path: 'payments/:id',
        loadComponent: () =>
          import('./features/payments/payment-view/payment-view.component').then(
            (m) => m.PaymentViewComponent,
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then((m) => m.ReportsComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
