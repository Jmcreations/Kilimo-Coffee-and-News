import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService, StaffUser, UserRole } from '../../services/auth.service';
import { StaffNav } from '../staff-nav/staff-nav';
import { TickerService } from '../../services/ticker';

interface NewsRecord {
  _id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  content: string;
  author: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StaffNav],
  templateUrl: './admin-dashboard.html'
})
export class AdminDashboard implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  tickerService = inject(TickerService);

  activeTab = signal<'users' | 'news'>('users');
  feedbackMsg = signal<string>('');
  errorMsg = signal<string>('');

  // Staff Management State
  users = signal<StaffUser[]>([]);
  editingUserId = signal<string | null>(null);
  userForm = {
    name: '',
    email: '',
    phone: '',
    role: 'journalist' as UserRole,
    password: ''
  };

  // News Management State
  articles = signal<NewsRecord[]>([]);
  editingArticleId = signal<string | null>(null);
  articleForm = {
    title: '',
    category: 'Market Report',
    readTime: '3 min read',
    author: '',
    content: ''
  };

  saleNumberInput = signal<number>(9);
  saleDateInput = signal<string>('');
  gradePriceInputs: Record<string, number | null> = {
    AA: null,
    AB: null,
    PB: null,
    C: null,
    E: null,
    TT: null
  };
  savingSale = signal<boolean>(false);
  saleMessage = signal<string>('');
  saleError = signal<string>('');

  ngOnInit(): void {
    this.loadUsers();
    this.loadArticles();
  }

  submitNceSaleUpdate(): void {
    this.saleMessage.set('');
    this.saleError.set('');
    this.savingSale.set(true);

    this.tickerService
      .updateSale({
        saleNumber: this.saleNumberInput(),
        saleDate: this.saleDateInput(),
        prices: this.gradePriceInputs
      })
      .subscribe({
        next: (updated) => {
          this.tickerService.ticker.set(updated);
          this.savingSale.set(false);
          this.saleMessage.set(
            `Ticker updated to Sale ${updated.latestSaleNumber}. Untraded grades carried over automatically.`
          );
          this.saleNumberInput.set(updated.latestSaleNumber + 1);
          this.gradePriceInputs = { AA: null, AB: null, PB: null, C: null, E: null, TT: null };
        },
        error: (err) => {
          this.savingSale.set(false);
          this.saleError.set(err.error?.message || 'Could not update NCE sale ticker.');
        }
      });
  }

  private clearAlerts(): void {
    this.feedbackMsg.set('');
    this.errorMsg.set('');
  }

  // --- STAFF USER CRUD ---
  loadUsers(): void {
    this.http.get<StaffUser[]>(`${this.auth.getApiBase()}/users`).subscribe({
      next: (data) => this.users.set(data),
      error: (err) => this.errorMsg.set(err.error?.message || 'Failed to load staff accounts.')
    });
  }

  startEditUser(user: StaffUser): void {
    this.clearAlerts();
    this.editingUserId.set(user.id);
    this.userForm = {
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      password: ''
    };
  }

  resetUserForm(): void {
    this.editingUserId.set(null);
    this.userForm = { name: '', email: '', phone: '', role: 'journalist', password: '' };
  }

  saveUser(): void {
    this.clearAlerts();
    const editId = this.editingUserId();

    if (editId) {
      this.http.put<StaffUser>(`${this.auth.getApiBase()}/users/${editId}`, this.userForm).subscribe({
        next: (updated) => {
          this.users.update((list) => list.map((u) => (u.id === editId ? updated : u)));
          this.feedbackMsg.set(`Updated ${updated.name}'s account.`);
          this.resetUserForm();
        },
        error: (err) => this.errorMsg.set(err.error?.message || 'Failed to update user.')
      });
    } else {
      if (!this.userForm.password || this.userForm.password.length < 6) {
        this.errorMsg.set('Password must be at least 6 characters for new accounts.');
        return;
      }
      this.http.post<StaffUser>(`${this.auth.getApiBase()}/users`, this.userForm).subscribe({
        next: (created) => {
          this.users.update((list) => [created, ...list]);
          this.feedbackMsg.set(`Created ${created.role} account for ${created.name}.`);
          this.resetUserForm();
        },
        error: (err) => this.errorMsg.set(err.error?.message || 'Failed to create user.')
      });
    }
  }

  deleteUser(user: StaffUser): void {
    if (!confirm(`Remove ${user.name} (${user.role})?`)) return;
    this.clearAlerts();
    this.http.delete(`${this.auth.getApiBase()}/users/${user.id}`).subscribe({
      next: () => {
        this.users.update((list) => list.filter((u) => u.id !== user.id));
        this.feedbackMsg.set(`Deleted user ${user.name}.`);
      },
      error: (err) => this.errorMsg.set(err.error?.message || 'Could not delete user.')
    });
  }

  // --- NEWS ARTICLE CRUD ---
  loadArticles(): void {
    this.http.get<NewsRecord[]>(`${this.auth.getApiBase()}/news`).subscribe({
      next: (data) => this.articles.set(data),
      error: (err) => this.errorMsg.set(err.error?.message || 'Failed to load news posts.')
    });
  }

  startEditArticle(article: NewsRecord): void {
    this.clearAlerts();
    this.editingArticleId.set(article._id);
    this.articleForm = {
      title: article.title,
      category: article.category,
      readTime: article.readTime,
      author: article.author,
      content: article.content
    };
  }

  cancelEditArticle(): void {
    this.editingArticleId.set(null);
  }

  saveArticleEdit(): void {
    const id = this.editingArticleId();
    if (!id) return;
    this.clearAlerts();

    this.http.put<NewsRecord>(`${this.auth.getApiBase()}/news/${id}`, this.articleForm).subscribe({
      next: (updated) => {
        this.articles.update((list) => list.map((a) => (a._id === id ? updated : a)));
        this.feedbackMsg.set('Article updated successfully.');
        this.editingArticleId.set(null);
      },
      error: (err) => this.errorMsg.set(err.error?.message || 'Failed to update article.')
    });
  }

  deleteArticle(article: NewsRecord): void {
    if (!confirm(`Delete article "${article.title}"?`)) return;
    this.clearAlerts();
    this.http.delete(`${this.auth.getApiBase()}/news/${article._id}`).subscribe({
      next: () => {
        this.articles.update((list) => list.filter((a) => a._id !== article._id));
        this.feedbackMsg.set('Article deleted.');
      },
      error: (err) => this.errorMsg.set(err.error?.message || 'Failed to delete article.')
    });
  }
}
