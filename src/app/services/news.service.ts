import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl.replace(/\/+$/, '');
  private getNormalizedApiBase(): string {
    const raw = environment.apiUrl.trim().replace(/\/+$/, '');
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  }
  private apiUrl = `${this.getNormalizedApiBase()}/news`;

  getArticles(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getArticleById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createArticle(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData);
  }

  // 1. Returns static local category covers
  getCategoryCover(category: string): string {
    const coverMap: Record<string, string> = {
      'Market Report': '/Images/Market-Report.jpg',
      'Policy & Trade': '/Images/Trade-Policies.jpg',
      'Farming Innovation': '/Images/Farming-Innovation.jpg',
      'Cooperative News': '/Images/Cooperative-news.jpg'
    };
    return coverMap[category] || '/Images/default.jpg';
  }

  // 2. Returns full URL for uploaded content images (or null if none was uploaded)
  getImageUrl(imagePath?: string, category?: string): string | null {
    if (!imagePath) {
      return category ? this.getCategoryCover(category) : null;
    }

    let cleanPath = imagePath
      .replace(/^https?:\/\/[^\/]+/, '') // Strip domain/localhost if present
      .replace(/\\/g, '/');               // Normalize Windows backslashes

    if (!cleanPath.startsWith('/')) {
      cleanPath = `/${cleanPath}`;
    }

    const backendBase = this.getNormalizedApiBase().replace(/\/api$/, '');
    return `${backendBase}${cleanPath}`;
  }
}
