import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NewsService } from '../../services/news.service';

@Component({
  selector: 'app-post-news',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './post-news.html',
  styleUrl: './post-news.scss'
})
export class PostNews {
  private newsService = inject(NewsService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  articleData = {
    title: '',
    category: 'Market Report',
    readTime: '3 min read',
    content: ''
  };

  selectedFile: File | null = null;
  submitting = false;
  successMessage = false;
  errorMessage = '';

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  publishArticle() {
    this.submitting = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const formData = new FormData();
    formData.append('title', this.articleData.title);
    formData.append('category', this.articleData.category);
    formData.append('readTime', this.articleData.readTime);
    formData.append('content', this.articleData.content);

    if (this.selectedFile) {
      formData.append('contentImage', this.selectedFile);
    }

    this.newsService.createArticle(formData).subscribe({
      next: () => {
        this.submitting = false;
        this.successMessage = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      },
      error: (err) => {
        console.error('Failed to post news:', err);
        this.submitting = false;
        this.errorMessage = err?.error?.message || 'Failed to publish post. Check console/network logs.';
        this.cdr.detectChanges();
      }
    });
  }
}