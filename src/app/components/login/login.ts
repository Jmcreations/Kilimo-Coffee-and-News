import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html'
})
export class Login implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  mode = signal<'login' | 'signup'>('login');
  isAppleDevice = signal<boolean>(false);
  activeSlide = signal<number>(0);

  slides = [
    {
      image: '/Images/kirinyaga.jpg',
      caption: 'Single-Origin Highland Lots,\nDirect From Kenyan Farms'
    },
    {
      image: '/Images/farming-innovation.jpg',
      caption: 'Live NCE Auction Insights &\nVerified Market Intelligence'
    },
    {
      image: '/Images/export.jpg',
      caption: 'Freshly Roasted & Delivered\nAcross Every County in Kenya'
    }
  ];

  firstName = '';
  lastName = '';
  email = '';
  password = '';
  agreedToTerms = true;
  showPassword = signal<boolean>(false);

  loading = signal<boolean>(false);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    if (this.route.snapshot.routeConfig?.path === 'sign-up') {
      this.mode.set('signup');
    }

    if (isPlatformBrowser(this.platformId)) {
      const ua = navigator.userAgent || '';
      const platform = navigator.platform || '';
      const isApple =
        /Mac|iPhone|iPad|iPod/i.test(platform) ||
        /Macintosh|Mac OS X|iPhone|iPad|iPod/i.test(ua);
      this.isAppleDevice.set(isApple);
    }
  }

  toggleMode(target: 'login' | 'signup'): void {
    this.mode.set(target);
    this.errorMessage.set('');
  }

  onSubmit(): void {
    this.errorMessage.set('');

    if (!this.email.trim() || !this.password) {
      this.errorMessage.set('Please enter your email and password.');
      return;
    }

    if (this.mode() === 'signup' && !this.agreedToTerms) {
      this.errorMessage.set('Please agree to the Terms & Conditions to continue.');
      return;
    }

    this.loading.set(true);

    const request$ =
      this.mode() === 'login'
        ? this.authService.login(this.email, this.password)
        : this.authService.register({
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            password: this.password
          });

    request$.subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Authentication failed. Please try again.');
      }
    });
  }

  continueWithProvider(provider: 'google' | 'microsoft' | 'apple'): void {
    // Wire your Google Identity Services / MSAL / Apple JS SDK token callback here;
    // once the SDK returns the user's verified email & name, pass them to authService.oauthLogin:
    const demoEmail = this.email.trim();
    if (!demoEmail) {
      this.errorMessage.set(
        `Enter your ${provider.charAt(0).toUpperCase() + provider.slice(1)} email above or connect your OAuth Client ID to launch the popup.`
      );
      return;
    }

    this.loading.set(true);
    const derivedName = `${this.firstName} ${this.lastName}`.trim() || demoEmail.split('@')[0];
    this.authService.oauthLogin(provider, demoEmail, derivedName).subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Social sign-in failed.');
      }
    });
  }
}
