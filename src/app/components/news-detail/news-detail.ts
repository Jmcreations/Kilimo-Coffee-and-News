import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
  copiedLink = signal<boolean>(false);

  paragraphs = computed(() => {
    const content = this.article()?.content || '';
    return content
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  });

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

  shareArticle(): void {
    const post = this.article();
    if (!post || typeof window === 'undefined') return;

    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: post.title,
          text: `${post.title} — Kilimo Coffee & News`,
          url: shareUrl
        })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.copiedLink.set(true);
        setTimeout(() => this.copiedLink.set(false), 2500);
      });
    }
  }
}
