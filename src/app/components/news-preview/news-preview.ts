import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NewsArticle, NewsService } from '../../services/news.service'; // Adjust relative path if needed

@Component({
  selector: 'app-news-preview',
  standalone: true,
  imports: [CommonModule, RouterModule], // RouterModule enables routerLink throughout the template
  templateUrl: './news-preview.html',
  styleUrl: './news-preview.scss'
})
export class NewsPreview implements OnInit {
  public newsService = inject(NewsService);
  private cdr = inject(ChangeDetectorRef);

  articles: any[] = [];
  featuredArticles: any[] = [];
  regularArticles: any[] = [];
  loading = true;

  ngOnInit(): void {
    this.fetchNews();
  }

  fetchNews(): void {
    this.newsService.getArticles().subscribe({
      next: (data: NewsArticle[]) => {
        this.articles = data.slice(0, 3);
        this.loading = false;
      },
      error: (error: unknown) => {
        console.error('Error fetching news:', error);
        this.loading = false;
      }
    });
  }

  getCategoryCover(category: string): string {
    const coverMap: Record<string, string> = {
      'Market Report': '/Images/Market-Report.jpg',
      'Trade Policies': '/Images/Trade-Policies.jpg',
      'Farming Innovation': '/Images/Farming-Innovation.jpg',
      'Cooperative News': '/Images/Cooperative-news.jpg'
    };

    return coverMap[category] || '/Images/default.jpg';
  }
}
