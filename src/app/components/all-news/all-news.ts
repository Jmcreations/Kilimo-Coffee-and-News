import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NewsService } from '../../services/news.service'; // Adjust relative path if needed

@Component({
  selector: 'app-all-news',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './all-news.html',
  styleUrl: './all-news.scss'
})
export class AllNews implements OnInit {
  public newsService = inject(NewsService);
  private cdr = inject(ChangeDetectorRef);

  articles: any[] = [];
  filteredArticles: any[] = [];
  selectedCategory: string = 'All';
  categories: string[] = ['All', 'Market Report', 'Trade Policies', 'Farming Innovation', 'Cooperative News'];
  loading: boolean = true;

  ngOnInit(): void {
    this.newsService.getArticles().subscribe({
      next: (data) => {
        this.articles = data || [];
        this.filteredArticles = this.articles;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching all news:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    if (category === 'All') {
      this.filteredArticles = this.articles;
    } else {
      this.filteredArticles = this.articles.filter(a => a.category === category);
    }
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