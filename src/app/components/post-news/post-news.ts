import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { NewsArticle, NewsService } from '../../services/news.service';
import { AuthService } from '../../services/auth.service';
import { NavigationHistoryService } from '../../services/navigation-history';
import { StaffNav } from '../staff-nav/staff-nav';

@Component({
  selector: 'app-post-news',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StaffNav],
  templateUrl: './post-news.html',
  styleUrl: './post-news.scss'
})
export class PostNews implements OnInit {
  private newsService = inject(NewsService);
  auth = inject(AuthService);
  navHistory = inject(NavigationHistoryService);

  // Form Fields
  title = '';
  category = 'Market Report';
  readTime = '3 min read';
  content = '';
  selectedFile: File | null = null;
  previewImageUrl = signal<string | null>(null);

  // Edit Mode State
  editingArticleId = signal<string | null>(null);

  // Upload Percentage Loader State
  submitting = signal<boolean>(false);
  uploadProgress = signal<number>(0);
  uploadStatusText = signal<string>('');
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  // Journalist's Own Articles
  allArticles = signal<NewsArticle[]>([]);
  loadingArticles = signal<boolean>(true);

  myArticles = computed(() => {
    const user = this.auth.currentUser();
    const list = this.allArticles();
    if (!user) return [];
    if (user.role === 'admin') return list;

    return list.filter(
      (a) =>
        (a.authorId && a.authorId === user.id) ||
        (a.author && a.author.trim().toLowerCase() === user.name.trim().toLowerCase())
    );
  });

  ngOnInit(): void {
    this.loadMyArticles();
  }

  loadMyArticles(): void {
    this.loadingArticles.set(true);
    this.newsService.getNews().subscribe({
      next: (data) => {
        this.allArticles.set(data);
        this.loadingArticles.set(false);
      },
      error: () => {
        this.loadingArticles.set(false);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.previewImageUrl.set(reader.result as string);
      reader.readAsDataURL(this.selectedFile);
    }
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
    this.previewImageUrl.set(null);
  }

  startEdit(article: NewsArticle): void {
    const id = article._id || article.id;
    if (!id) return;

    this.successMessage.set('');
    this.errorMessage.set('');
    this.editingArticleId.set(id);
    this.title = article.title;
    this.category = article.category;
    this.readTime = article.readTime || '3 min read';
    this.content = article.content;
    this.selectedFile = null;
    this.previewImageUrl.set(this.newsService.getImageUrl(article.contentImage));

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingArticleId.set(null);
    this.title = '';
    this.category = 'Market Report';
    this.readTime = '3 min read';
    this.content = '';
    this.clearSelectedFile();
  }

  deleteOwnArticle(article: NewsArticle): void {
    const id = article._id || article.id;
    if (!id) return;
    if (!confirm(`Delete "${article.title}"? This action cannot be undone.`)) return;

    this.newsService.deleteNews(id).subscribe({
      next: () => {
        this.allArticles.update((list) => list.filter((a) => (a._id || a.id) !== id));
        if (this.editingArticleId() === id) {
          this.cancelEdit();
        }
        this.successMessage.set('Article deleted.');
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Could not delete article.');
      }
    });
  }

  onSubmit(): void {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (!this.title.trim() || !this.category || !this.content.trim()) {
      this.errorMessage.set('Please fill in the headline, category, and article content.');
      return;
    }

    const formData = new FormData();
    formData.append('title', this.title.trim());
    formData.append('category', this.category);
    formData.append('readTime', this.readTime.trim() || '3 min read');
    formData.append('content', this.content.trim());
    formData.append('author', this.auth.currentUser()?.name || 'Kilimo News Desk');

    if (this.selectedFile) {
      formData.append('contentImage', this.selectedFile);
    }

    this.submitting.set(true);
    this.uploadProgress.set(5);
    this.uploadStatusText.set(
      this.selectedFile ? 'Uploading photo & article... 5%' : 'Publishing article... 5%'
    );

    const editId = this.editingArticleId();
    const request$ = editId
      ? this.newsService.updateNewsWithProgress(editId, formData)
      : this.newsService.createNewsWithProgress(formData);

    request$.subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total || 1;
          const pct = Math.min(99, Math.round((event.loaded / total) * 100));
          this.uploadProgress.set(pct);
          this.uploadStatusText.set(
            this.selectedFile
              ? `Uploading photo & article... ${pct}%`
              : `Sending article... ${pct}%`
          );
        } else if (event.type === HttpEventType.Response) {
          this.uploadProgress.set(100);
          this.uploadStatusText.set('Completed! 100%');
          this.submitting.set(false);

          const saved = event.body;
          if (editId && saved) {
            this.allArticles.update((list) =>
              list.map((a) => ((a._id || a.id) === editId ? saved : a))
            );
            this.successMessage.set('Your article updates have been saved.');
          } else if (saved) {
            this.allArticles.update((list) => [saved, ...list]);
            this.successMessage.set(
              `Published! Credited to ${saved.author}.`
            );
          }

          this.cancelEdit();
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.uploadProgress.set(0);
        this.uploadStatusText.set('');
        this.errorMessage.set(
          err.error?.message || 'Failed to save article. Please check your connection and try again.'
        );
      }
    });
  }
}
