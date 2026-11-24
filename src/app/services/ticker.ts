import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface TickerGrade {
  grade: 'AA' | 'AB' | 'PB' | 'C' | 'E' | 'TT';
  price: number;
  change: number;
  lastSaleNumber: number;
}

export interface NceTickerData {
  _id?: string;
  latestSaleNumber: number;
  lastSaleDate: string;
  grades: TickerGrade[];
}

@Injectable({ providedIn: 'root' })
export class TickerService {
  private http = inject(HttpClient);

  private getApiBase(): string {
    const raw = environment.apiUrl.trim().replace(/\/+$/, '');
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw) || raw.startsWith('/')) return raw;
    return `https://${raw}`;
  }

  private apiUrl = `${this.getApiBase()}/ticker`;

  ticker = signal<NceTickerData>({
    latestSaleNumber: 8,
    lastSaleDate: '',
    grades: [
      { grade: 'AA', price: 645.0, change: 12.0, lastSaleNumber: 8 },
      { grade: 'AB', price: 548.0, change: 5.1, lastSaleNumber: 8 },
      { grade: 'PB', price: 590.75, change: -3.5, lastSaleNumber: 8 },
      { grade: 'C', price: 420.0, change: 0.0, lastSaleNumber: 8 },
      { grade: 'E', price: 645.0, change: 12.0, lastSaleNumber: 8 },
      { grade: 'TT', price: 390.5, change: -1.25, lastSaleNumber: 8 }
    ]
  });

  loadTicker(): void {
    this.http.get<NceTickerData>(this.apiUrl).subscribe({
      next: (data) => {
        if (data && Array.isArray(data.grades) && data.grades.length > 0) {
          this.ticker.set(data);
        }
      },
      error: (err) => console.error('Ticker load warning:', err)
    });
  }

  updateSale(payload: {
    saleNumber: number;
    saleDate?: string;
    prices: Record<string, number | null>;
  }) {
    return this.http.put<NceTickerData>(this.apiUrl, payload);
  }
}
