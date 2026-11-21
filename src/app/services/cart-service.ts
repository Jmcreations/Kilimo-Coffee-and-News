import { Injectable, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

export type CoffeeRegion =
  | 'Kirinyaga'
  | 'Nyeri'
  | 'Muranga'
  | 'Kiambu'
  | 'Kericho'
  | 'Nandi'
  | 'Machakos';

export type CoffeeForm = 'Roasted Beans' | 'Ground Coffee';
export type RoastLevel = 'Medium Roast' | 'Dark Roast' | null;
export type PackSize = '250g' | '500g' | '1kg';

export interface CartItem {
  key: string;
  region: CoffeeRegion;
  coffeeForm: CoffeeForm;
  roastLevel: RoastLevel;
  packSize: PackSize;
  quantity: number;
  unitPrice: number;
  image: string;
}

export interface OrderPayload {
  items: {
    region: CoffeeRegion;
    coffeeForm: CoffeeForm;
    roastLevel: RoastLevel;
    packSize: PackSize;
    quantity: number;
    unitPrice: number;
  }[];
  customer: {
    fullName: string;
    phone: string;
    email?: string;
    county: string;
    deliveryLocation: string;
    deliveryNotes?: string;
  };
  deliveryMethod: 'Doorstep Delivery' | 'Pickup Station';
  preferredDeliveryDate?: string;
  deliveryFee: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  private readonly STORAGE_KEY = 'kilimo_coffee_cart_v1';

  items = signal<CartItem[]>(this.loadFromStorage());
  drawerOpen = signal<boolean>(false);

  totalItems = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0)
  );

  subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  );

  private loadFromStorage(): CartItem[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(cart: CartItem[]): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors
    }
  }

  addItem(entry: Omit<CartItem, 'key'>): void {
    const normalizedRoast: RoastLevel =
      entry.coffeeForm === 'Roasted Beans' ? entry.roastLevel || 'Medium Roast' : null;

    const key = `${entry.region}::${entry.coffeeForm}::${normalizedRoast ?? 'none'}::${entry.packSize}`;

    this.items.update((current) => {
      const existingIndex = current.findIndex((i) => i.key === key);
      let updated: CartItem[];

      if (existingIndex > -1) {
        updated = current.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + entry.quantity }
            : item
        );
      } else {
        updated = [
          ...current,
          {
            ...entry,
            roastLevel: normalizedRoast,
            key
          }
        ];
      }

      this.saveToStorage(updated);
      return updated;
    });
  }

  updateQuantity(key: string, delta: number): void {
    this.items.update((current) => {
      const updated = current
        .map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0);

      this.saveToStorage(updated);
      return updated;
    });
  }

  removeItem(key: string): void {
    this.items.update((current) => {
      const updated = current.filter((item) => item.key !== key);
      this.saveToStorage(updated);
      return updated;
    });
  }

  clearCart(): void {
    this.items.set([]);
    this.saveToStorage([]);
  }

  placeOrder(payload: OrderPayload) {
    return this.http.post<any>(`${this.auth.getApiBase()}/orders`, payload);
  }
}
