import { Injectable, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NavigationHistoryService {
  private router = inject(Router);
  private auth = inject(AuthService);

  private currentUrl = signal<string>('/');
  private previousUrl = signal<string | null>(null);

  constructor() {
    this.currentUrl.set(this.router.url || '/');

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const nextUrl = event.urlAfterRedirects || event.url;
        if (nextUrl !== this.currentUrl()) {
          this.previousUrl.set(this.currentUrl());
          this.currentUrl.set(nextUrl);
        }
      });
  }

  backTarget = computed(() => {
    const prev = this.previousUrl();
    // Ignore /login or self-references so Back always exits to a meaningful page
    if (prev && !prev.startsWith('/login') && !prev.startsWith('/post-news')) {
      return prev;
    }
    return this.auth.hasRole('admin') ? '/admin' : '/';
  });

  backLabel = computed(() => {
    const target = this.backTarget().split('?')[0];
    if (target === '/admin') return 'Back to Admin Console';
    if (target === '/all-news') return 'Back to All News';
    if (target === '/delivery-orders') return 'Back to Delivery Orders';
    if (target === '/purchase-coffee') return 'Back to Coffee Store';
    if (target.startsWith('/news/')) return 'Back to Article';
    return 'Back to Home';
  });

  goBack(): void {
    this.router.navigateByUrl(this.backTarget());
  }
}
