import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  // Auth pages live OUTSIDE the shell (no sidebar/topbar).
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },

  // Authenticated app inside the shell layout.
  {
    path: '',
    component: ShellComponent,
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
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
