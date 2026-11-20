import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from '../app/components/login/login';
import { PostNews } from './components/post-news/post-news';
import { NewsDetail } from './components/news-detail/news-detail';
import { AllNews } from './components/all-news/all-news';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'post-news', component: PostNews },
  { path: 'all-news', component: AllNews },
  { path: 'news/:id', component: NewsDetail }, // Dynamic route for news details
  { path: '**', redirectTo: '' } // Catches broken URLs and sends them home
];
