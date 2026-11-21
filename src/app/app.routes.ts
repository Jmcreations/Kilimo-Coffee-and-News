import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', component: Home },
  {
    path: 'all-news',
    loadComponent: () =>
      import('./components/all-news/all-news').then((m) => m.AllNews)
  },
  {
    path: 'news/:id',
    loadComponent: () =>
      import('./components/news-detail/news-detail').then((m) => m.NewsDetail)
  },
  {
    path: 'purchase-coffee',
    loadComponent: () =>
      import('./components/purchase-coffee/purchase-coffee').then(
        (m) => m.PurchaseCoffee
      )
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login').then((m) => m.Login)
  },
  {
    path: 'post-news',
    loadComponent: () =>
      import('./components/post-news/post-news').then((m) => m.PostNews),
    canActivate: [roleGuard],
    data: { roles: ['journalist', 'admin'] }
  },
  {
    path: 'delivery-orders',
    loadComponent: () =>
      import('./components/delivery-orders/delivery-orders').then(
        (m) => m.DeliveryOrders
      ),
    canActivate: [roleGuard],
    data: { roles: ['delivery', 'admin'] }
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./components/admin-dashboard/admin-dashboard').then(
        (m) => m.AdminDashboard
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] }
  },
  { path: '**', redirectTo: '' }
];
