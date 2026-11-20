import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NewsService } from '../../services/news.service'; // Adjust relative path if needed

@Component({
  selector: 'app-news-preview',
  standalone: true,
  imports: [CommonModule, RouterModule], // RouterModule enables routerLink throughout the template
  templateUrl: './news-preview.html',
  styleUrl: './news-preview.scss'
})
export class NewsPreview implements OnInit {
  private newsService = inject(NewsService);
  private cdr = inject(ChangeDetectorRef);

  featuredArticles: any[] = [];
  regularArticles: any[] = [];

  ngOnInit(): void {
    this.fetchNews();
  }

  fetchNews(): void {
    this.newsService.getArticles().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          // First 2 articles go to the featured section
          this.featuredArticles = data.slice(0, 2);
          // 3rd to 5th articles go to the regular section
          this.regularArticles = data.slice(2, 5);
        } else {
          console.warn('⚠️ No articles found in database!');
          this.featuredArticles = [];
          this.regularArticles = [];
        }

        this.cdr.detectChanges(); // Manually trigger change detection
      },
      error: (error) => {
        console.error('❌ Error fetching news:', error);
      }
    });
  }

  getCategoryCover(category: string): string {
    const coverMap: Record<string, string> = {
      'Market Report': '/Images/Market-Report.jpg',
      'Policy & Trade': '/Images/Trade-Policies.jpg',
      'Farming Innovation': '/Images/Farming-Innovation.jpg',
      'Cooperative News': '/Images/Cooperative-news.jpg'
    };

    return coverMap[category] || '/Images/default.jpg';
  }
}