import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PublicAppConfig {
  googleClientId: string;
  microsoftClientId: string;
  appleClientId: string;
  googleMapsApiKey: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private getApiBase(): string {
    const raw = environment.apiUrl.trim().replace(/\/+$/, '');
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  }

  config = signal<PublicAppConfig>({
    googleClientId: '',
    microsoftClientId: '',
    appleClientId: '',
    googleMapsApiKey: ''
  });

  private loaded = false;
  private mapsScriptPromise: Promise<void> | null = null;

  async ensureLoaded(): Promise<PublicAppConfig> {
    if (this.loaded) return this.config();
    try {
      const data = await firstValueFrom(
        this.http.get<PublicAppConfig>(`${this.getApiBase()}/config/public`)
      );
      this.config.set(data);
      this.loaded = true;
      return data;
    } catch {
      return this.config();
    }
  }

  async loadGoogleMapsScript(): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) return false;
    if ((window as any).google?.maps) return true;

    const cfg = await this.ensureLoaded();
    if (!cfg.googleMapsApiKey) return false;

    if (!this.mapsScriptPromise) {
      this.mapsScriptPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(cfg.googleMapsApiKey)}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Maps'));
        document.head.appendChild(script);
      });
    }

    try {
      await this.mapsScriptPromise;
      return true;
    } catch {
      return false;
    }
  }
}
