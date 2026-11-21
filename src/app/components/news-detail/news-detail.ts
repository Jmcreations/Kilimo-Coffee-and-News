import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NewsArticle, NewsService } from '../../services/news.service';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './news-detail.html',
  styleUrl: './news-detail.scss'
})
export class NewsDetail implements OnInit {
  private route = inject(ActivatedRoute);
  newsService = inject(NewsService);

  article = signal<NewsArticle | null>(null);
  loading = signal<boolean>(true);
  error = signal<boolean>(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id || id === 'undefined') {
        this.error.set(true);
        this.loading.set(false);
        return;
      }

      this.loading.set(true);
      this.error.set(false);

      this.newsService.getNewsById(id).subscribe({
        next: (data) => {
          this.article.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        }
      });
    });
  }
}
