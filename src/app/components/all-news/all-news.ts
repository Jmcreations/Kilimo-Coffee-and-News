import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NewsArticle, NewsService } from '../../services/news.service';
import { HomeBrandBar } from '../home-brand-bar/home-brand-bar';

@Component({
  selector: 'app-all-news',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HomeBrandBar],
  templateUrl: './all-news.html',
  styleUrl: './all-news.scss'
})
export class AllNews implements OnInit {
  newsService = inject(NewsService);

  allArticles = signal<NewsArticle[]>([]);
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  // Search & Filter Signals
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('All');
  selectedDate = signal<string>(''); // YYYY-MM-DD from <input type="date">
  sortOrder = signal<'newest' | 'oldest'>('newest');

  readonly categories = [
    'All',
    'Market Report',
    'Cooperative News',
    'Farming Innovation',
    'Trade Policies'
  ];

  filteredArticles = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const category = this.selectedCategory();
    const dateFilter = this.selectedDate();
    const order = this.sortOrder();

    const filtered = this.allArticles().filter((article) => {
      // 1. Search by title (and author)
      const matchesTitle =
        !query ||
        article.title.toLowerCase().includes(query) ||
        (article.author && article.author.toLowerCase().includes(query));

      // 2. Filter by category
      const matchesCategory =
        category === 'All' ||
        article.category.toLowerCase() === category.toLowerCase();

      // 3. Filter by exact date posted
      const matchesDate =
        !dateFilter || this.toIsoDateString(article.date) === dateFilter;

      return matchesTitle && matchesCategory && matchesDate;
    });

    return order === 'oldest' ? [...filtered].reverse() : filtered;
  });

  hasActiveFilters = computed(
    () =>
      this.searchQuery().trim() !== '' ||
      this.selectedCategory() !== 'All' ||
      this.selectedDate() !== ''
  );

  ngOnInit(): void {
    this.fetchArticles();
  }

  fetchArticles(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.newsService
      .getArticles()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data: NewsArticle[]) => {
          this.allArticles.set(Array.isArray(data) ? data : []);
        },
        error: () => {
          this.errorMessage.set('Could not load news articles. Please try again.');
        }
      });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('All');
    this.selectedDate.set('');
    this.sortOrder.set('newest');
  }

  // Converts stored "November 21, 2026" string into "2026-11-21" for <input type="date"> comparison
  private toIsoDateString(dateStr?: string): string {
    if (!dateStr) return '';
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) return '';
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
