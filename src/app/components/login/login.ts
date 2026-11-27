import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PublicClientApplication } from '@azure/msal-browser';
import { AuthService } from '../../services/auth.service';
import { ConfigService } from '../../services/config';

declare const google: any;
declare const AppleID: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html'
})
export class Login implements OnInit {
  private authService = inject(AuthService);
  private configService = inject(ConfigService);
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

  private msalInstance: PublicClientApplication | null = null;

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

      // Preload public OAuth client IDs from Northflank
      this.configService.ensureLoaded();
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

  async continueWithProvider(provider: 'google' | 'microsoft' | 'apple'): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    this.errorMessage.set('');
    this.loading.set(true);

    try {
      const cfg = await this.configService.ensureLoaded();

      if (provider === 'google') {
        if (!cfg.googleClientId || typeof google === 'undefined') {
          this.loading.set(false);
          this.errorMessage.set('Google Sign-In is still initializing. Please try again in a moment.');
          return;
        }

        google.accounts.id.initialize({
          client_id: cfg.googleClientId,
          callback: (response: any) => {
            this.authService
              .oauthLogin({ provider: 'google', idToken: response.credential })
              .subscribe({
                next: () => this.loading.set(false),
                error: (err) => {
                  this.loading.set(false);
                  this.errorMessage.set(err.error?.message || 'Google sign-in failed.');
                }
              });
          }
        });

        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            this.loading.set(false);
          }
        });
      } else if (provider === 'microsoft') {
        if (!cfg.microsoftClientId) {
          this.loading.set(false);
          this.errorMessage.set('Microsoft Sign-In is not configured yet.');
          return;
        }

        if (!this.msalInstance) {
          this.msalInstance = new PublicClientApplication({
            auth: {
              clientId: cfg.microsoftClientId,
              redirectUri: window.location.origin
            }
          });
          await this.msalInstance.initialize();
        }

        const result = await this.msalInstance.loginPopup({ scopes: ['User.Read'] });
        this.authService
          .oauthLogin({
            provider: 'microsoft',
            accessToken: result.accessToken,
            fallbackName: result.account?.name || ''
          })
          .subscribe({
            next: () => this.loading.set(false),
            error: (err) => {
              this.loading.set(false);
              this.errorMessage.set(err.error?.message || 'Microsoft sign-in failed.');
            }
          });
      } else if (provider === 'apple') {
        if (!cfg.appleClientId || typeof AppleID === 'undefined') {
          this.loading.set(false);
          this.errorMessage.set('Apple Sign-In is not configured yet.');
          return;
        }

        AppleID.auth.init({
          clientId: cfg.appleClientId,
          scope: 'name email',
          redirectURI: window.location.origin + '/login',
          usePopup: true
        });

        const appleRes = await AppleID.auth.signIn();
        const fullName = appleRes.user?.name
          ? `${appleRes.user.name.firstName || ''} ${appleRes.user.name.lastName || ''}`.trim()
          : '';

        this.authService
          .oauthLogin({
            provider: 'apple',
            idToken: appleRes.authorization.id_token,
            fallbackName: fullName
          })
          .subscribe({
            next: () => this.loading.set(false),
            error: (err) => {
              this.loading.set(false);
              this.errorMessage.set(err.error?.message || 'Apple sign-in failed.');
            }
          });
      }
    } catch (err: any) {
      this.loading.set(false);
      this.errorMessage.set(err?.message || 'Sign-in popup was closed or blocked.');
    }
  }
}
