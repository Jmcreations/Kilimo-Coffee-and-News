import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NewsArticle, NewsService } from '../../services/news.service';

@Component({
  selector: 'app-news-preview',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './news-preview.html',
  styleUrl: './news-preview.scss'
})
export class NewsPreview implements OnInit {
  newsService = inject(NewsService);

  articles = signal<NewsArticle[]>([]);
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    this.loadArticles();
  }

  loadArticles(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.newsService
      .getArticles()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data: NewsArticle[]) => {
          const list = Array.isArray(data) ? data : [];
          this.articles.set(list.slice(0, 3));
        },
        error: (err: unknown) => {
          console.error('Error fetching news:', err);
          this.errorMessage.set('Unable to load latest news right now.');
        }
      });
  }
}
