import { Component, OnInit, ChangeDetectorRef, inject, } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NewsService } from '../../services/news.service';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './news-detail.html',
  styleUrl: './news-detail.scss'
})
export class NewsDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  public newsService = inject(NewsService); // Made public so HTML can access newsService.getImageUrl
  private cdr = inject(ChangeDetectorRef);

  article: any = null;
  loading: boolean = true;
  errorMessage: string = '';
  cameFromAllNews: boolean = false;

  ngOnInit(): void {
    // Listen for query params ('?from=all')
    this.route.queryParamMap.subscribe(params => {
      this.cameFromAllNews = (params.get('from') === 'all');
      this.cdr.detectChanges();
    });

    // Subscribe to route params so changes re-trigger article loading
    this.route.paramMap.subscribe(params => {
      const articleId = params.get('id');
      if (articleId) {
        this.fetchArticle(articleId);
      } else {
        this.errorMessage = 'Article not found.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchArticle(id: string): void {
    this.loading = true;
    this.newsService.getArticleById(id).subscribe({
      next: (data) => {
        this.article = data;
        this.loading = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Failed to load article:', err);
        this.errorMessage = 'Could not load article. Please try again.';
        this.loading = false;
        this.cdr.detectChanges(); 
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}