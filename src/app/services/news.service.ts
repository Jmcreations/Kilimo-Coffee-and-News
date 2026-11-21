import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NewsArticle {
  _id?: string;
  id?: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  content: string;
  contentImage?: string | null;
  author: string;
  authorId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class NewsService {
  private http = inject(HttpClient);

  private getApiBase(): string {
    const raw = environment.apiUrl.trim().replace(/\/+$/, '');
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  }

  private apiUrl = `${this.getApiBase()}/news`;

  getNews(): Observable<NewsArticle[]> {
    return this.http.get<NewsArticle[]>(this.apiUrl);
  }

  getNewsById(id: string): Observable<NewsArticle> {
    return this.http.get<NewsArticle>(`${this.apiUrl}/${id}`);
  }

  createNewsWithProgress(formData: FormData): Observable<HttpEvent<NewsArticle>> {
    return this.http.post<NewsArticle>(this.apiUrl, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  updateNewsWithProgress(id: string, formData: FormData): Observable<HttpEvent<NewsArticle>> {
    return this.http.put<NewsArticle>(`${this.apiUrl}/${id}`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  deleteNews(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getCategoryCover(category: string): string {
    const normalized = (category || '').toLowerCase();
    if (normalized.includes('cooperative')) return '/Images/Cooperative-news.jpg';
    if (normalized.includes('innovation') || normalized.includes('farming')) {
      return '/Images/Farming-Innovation.jpg';
    }
    if (normalized.includes('policy') || normalized.includes('trade')) {
      return '/Images/Trade-Policies.jpg';
    }
    return '/Images/Market-Report.jpg';
  }

  getImageUrl(imagePath?: string | null): string | null {
    if (!imagePath) return null;
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    const backendOrigin = this.getApiBase().replace(/\/api$/, '');
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${backendOrigin}${cleanPath}`;
  }
}
