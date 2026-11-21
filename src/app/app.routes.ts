import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { AllNews } from './components/all-news/all-news';
import { NewsDetail } from './components/news-detail/news-detail';
import { PostNews } from './components/post-news/post-news';
import { Login } from './components/login/login';
import { DeliveryOrders } from './components/delivery-orders/delivery-orders';
import { AdminDashboard } from './components/admin-dashboard/admin-dashboard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'all-news', component: AllNews },
  { path: 'news/:id', component: NewsDetail },
  { path: 'login', component: Login },
  {
    path: 'post-news',
    component: PostNews,
    canActivate: [roleGuard],
    data: { roles: ['journalist', 'admin'] }
  },
  {
    path: 'delivery-orders',
    component: DeliveryOrders,
    canActivate: [roleGuard],
    data: { roles: ['delivery', 'admin'] }
  },
  {
    path: 'admin',
    component: AdminDashboard,
    canActivate: [roleGuard],
    data: { roles: ['admin'] }
  }
];
