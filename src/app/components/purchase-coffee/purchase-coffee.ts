import { Component, OnInit, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HomeBrandBar } from '../home-brand-bar/home-brand-bar';
import { CartItem, CartService, CoffeeRegion, RoastLevel } from '../../services/cart-service';
import { AuthService } from '../../services/auth.service';
import { ConfigService } from '../../services/config';
import { environment } from '../../../environments/environment';

declare const google: any;

export interface CoffeeProduct {
  id: string;
  name: string;
  region: string;
  grade: 'AA' | 'AB' | 'PB';
  roastLevel: 'Light-Medium' | 'Medium' | 'Medium-Dark' | 'Green (Unroasted)';
  altitude: string;
  tastingNotes: string;
  image: string;
  prices: {
    '250g': number;
    '500g': number;
    '1kg': number;
  };
}

@Component({
  selector: 'app-purchase-coffee',
  standalone: true,
  imports: [CommonModule, FormsModule, HomeBrandBar],
  templateUrl: './purchase-coffee.html'
})
export class PurchaseCoffee implements OnInit {
  cart = inject(CartService);
  auth = inject(AuthService);
  private configService = inject(ConfigService);
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private getApiBase(): string {
    const raw = environment.apiUrl.trim().replace(/\/+$/, '');
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  }

  selectedGrade = signal<string>('ALL');
  selectedSizes = signal<Record<string, '250g' | '500g' | '1kg'>>({});
  selectedGrinds = signal<Record<string, string>>({});
  addedFeedbackId = signal<string | null>(null);

  // Cart & Checkout Drawer State
  drawerOpen = signal<boolean>(false);
  checkoutStep = signal<'cart' | 'delivery' | 'confirm'>('cart');
  submittingOrder = signal<boolean>(false);
  orderSuccessNumber = signal<string | null>(null);
  orderError = signal<string>('');
  mapsReady = signal<boolean>(false);

  counties = [
    'Nairobi',
    'Kiambu',
    'Murang\'a',
    'Nyeri',
    'Kirinyaga',
    'Embu',
    'Meru',
    'Nakuru',
    'Uasin Gishu',
    'Mombasa',
    'Kisumu',
    'Machakos'
  ];

  deliveryForm = {
    fullName: '',
    phone: '',
    email: '',
    deliveryMethod: 'Doorstep Delivery' as 'Doorstep Delivery' | 'Pickup Station',
    county: 'Nairobi',
    deliveryLocation: '',
    notes: '',
    latitude: -1.286389,
    longitude: 36.817223,
    mapsUrl: ''
  };

  products: CoffeeProduct[] = [
    {
      id: 'nyeri-aa-reserve',
      name: 'Nyeri Othaya Single-Estate AA',
      region: 'Nyeri County',
      grade: 'AA',
      roastLevel: 'Medium',
      altitude: '1,850 – 1,950 MASL',
      tastingNotes: 'Blackcurrant, bright citrus acidity, dark cocoa finish',
      image: '/Images/grade-aa.jpg',
      prices: { '250g': 1150, '500g': 2150, '1kg': 4100 }
    },
    {
      id: 'kirinyaga-ab-lot',
      name: 'Kirinyaga Baragwi Cooperative AB',
      region: 'Kirinyaga County',
      grade: 'AB',
      roastLevel: 'Light-Medium',
      altitude: '1,750 – 1,900 MASL',
      tastingNotes: 'Floral jasmine aroma, blood orange, cane sugar sweetness',
      image: '/Images/kirinyaga.jpg',
      prices: { '250g': 1050, '500g': 1950, '1kg': 3750 }
    },
    {
      id: 'muranga-pb-micro',
      name: 'Murang\'a Kangema Peaberry (PB)',
      region: 'Murang\'a County',
      grade: 'PB',
      roastLevel: 'Medium',
      altitude: '1,800 – 1,920 MASL',
      tastingNotes: 'Concentrated berry sweetness, caramel body, crisp finish',
      image: '/Images/grade-pb.jpg',
      prices: { '250g': 1250, '500g': 2350, '1kg': 4450 }
    },
    {
      id: 'kiambu-espresso-aa',
      name: 'Kiambu Highland Dark Roast AA',
      region: 'Kiambu County',
      grade: 'AA',
      roastLevel: 'Medium-Dark',
      altitude: '1,700 – 1,850 MASL',
      tastingNotes: 'Roasted hazelnut, molasses, velvety espresso crema',
      image: '/Images/muranga.jpg',
      prices: { '250g': 1100, '500g': 2050, '1kg': 3900 }
    },
    {
      id: 'kenya-ab-classic',
      name: 'Mount Kenya Classic Filter AB',
      region: 'Embu & Meru',
      grade: 'AB',
      roastLevel: 'Medium',
      altitude: '1,650 – 1,820 MASL',
      tastingNotes: 'Red plum, milk chocolate, balanced everyday cup',
      image: '/Images/grade-ab.jpg',
      prices: { '250g': 980, '500g': 1850, '1kg': 3500 }
    },
    {
      id: 'green-export-aa',
      name: 'Unroasted Green Micro-Lot AA',
      region: 'Nyeri & Kirinyaga',
      grade: 'AA',
      roastLevel: 'Green (Unroasted)',
      altitude: '1,850+ MASL',
      tastingNotes: 'Washed SL28 & SL34 screen 18+ beans for home or commercial roasting',
      image: '/Images/export.jpg',
      prices: { '250g': 850, '500g': 1600, '1kg': 3000 }
    }
  ];

  filteredProducts = computed(() => {
    const grade = this.selectedGrade();
    if (grade === 'ALL') return this.products;
    return this.products.filter((p) => p.grade === grade);
  });

  subtotal = computed(() =>
    this.cart.items().reduce((sum: number, item) => sum + item.unitPrice * item.quantity, 0)
  );

  // Flat-rate delivery fees (no free delivery)
  deliveryFee = computed(() => {
    if (this.cart.items().length === 0) return 0;
    return this.deliveryForm.deliveryMethod === 'Doorstep Delivery' ? 350 : 150;
  });

  grandTotal = computed(() => this.subtotal() + this.deliveryFee());

  ngOnInit(): void {
    const defaultsSizes: Record<string, '250g' | '500g' | '1kg'> = {};
    const defaultsGrinds: Record<string, string> = {};
    for (const p of this.products) {
      defaultsSizes[p.id] = '500g';
      defaultsGrinds[p.id] = p.roastLevel === 'Green (Unroasted)' ? 'Unroasted Green Beans' : 'Whole Bean';
    }
    this.selectedSizes.set(defaultsSizes);
    this.selectedGrinds.set(defaultsGrinds);

    const user = this.auth.currentUser();
    if (user) {
      this.deliveryForm.fullName = user.name || '';
      this.deliveryForm.email = user.email || '';
    }
  }

  getSize(productId: string): '250g' | '500g' | '1kg' {
    return this.selectedSizes()[productId] || '500g';
  }

  setSize(productId: string, size: '250g' | '500g' | '1kg'): void {
    this.selectedSizes.update((prev) => ({ ...prev, [productId]: size }));
  }

  getGrind(productId: string): string {
    return this.selectedGrinds()[productId] || 'Whole Bean';
  }

  setGrind(productId: string, grind: string): void {
    this.selectedGrinds.update((prev) => ({ ...prev, [productId]: grind }));
  }

  getUnitPrice(product: CoffeeProduct): number {
    return product.prices[this.getSize(product.id)];
  }

  private toCoffeeRegion(productRegion: string): CoffeeRegion {
    const region = productRegion.toLowerCase();
    if (region.includes('kirinyaga')) return 'Kirinyaga';
    if (region.includes('nyeri')) return 'Nyeri';
    if (region.includes('murang')) return 'Muranga';
    if (region.includes('kiambu')) return 'Kiambu';
    if (region.includes('kericho')) return 'Kericho';
    if (region.includes('nandi')) return 'Nandi';
    return 'Machakos';
  }

  getCartItemName(item: CartItem): string {
    return `${item.region} Coffee`;
  }

  getCartItemPreparation(item: CartItem): string {
    if (item.roastLevel === null) return 'Unroasted Green Beans';
    return item.coffeeForm === 'Ground Coffee' ? 'Ground Coffee' : 'Whole Bean';
  }

  addToCart(product: CoffeeProduct): void {
    const size = this.getSize(product.id);
    const grind = this.getGrind(product.id);
    const unitPrice = product.prices[size];
    const cartAny = this.cart as any;
    const isGreen = product.roastLevel === 'Green (Unroasted)';
    const roastLevel: RoastLevel =
      isGreen ? null : product.roastLevel === 'Medium-Dark' ? 'Dark Roast' : 'Medium Roast';
    const coffeeForm = !isGreen && grind !== 'Whole Bean' ? 'Ground Coffee' : 'Roasted Beans';

    const payload = {
      region: this.toCoffeeRegion(product.region),
      coffeeForm,
      roastLevel,
      packSize: size,
      unitPrice,
      image: product.image,
      quantity: 1
    };

    if (typeof cartAny.addItem === 'function') {
      cartAny.addItem(payload);
    } else if (typeof cartAny.addToCart === 'function') {
      cartAny.addToCart(payload);
    }

    this.addedFeedbackId.set(product.id);
    setTimeout(() => {
      if (this.addedFeedbackId() === product.id) {
        this.addedFeedbackId.set(null);
      }
    }, 1400);
  }

  changeItemQuantity(item: CartItem, delta: number): void {
    const cartAny = this.cart as any;
    const nextQty = item.quantity + delta;
    if (nextQty <= 0) {
      this.removeCartItem(item);
      return;
    }
    if (typeof cartAny.updateQuantity === 'function') {
      cartAny.updateQuantity(item.key, delta);
    } else if (typeof cartAny.changeQuantity === 'function') {
      cartAny.changeQuantity(item.key, delta);
    }
  }

  removeCartItem(item: CartItem): void {
    const cartAny = this.cart as any;
    if (typeof cartAny.removeItem === 'function') {
      cartAny.removeItem(item.key);
    } else if (typeof cartAny.removeFromCart === 'function') {
      cartAny.removeFromCart(item.key);
    }
  }

  openCartDrawer(step: 'cart' | 'delivery' | 'confirm' = 'cart'): void {
    this.orderError.set('');
    this.orderSuccessNumber.set(null);
    this.drawerOpen.set(true);
    this.goToStep(step);
  }

  closeCartDrawer(): void {
    this.drawerOpen.set(false);
  }

  goToStep(step: 'cart' | 'delivery' | 'confirm'): void {
    this.orderError.set('');
    this.checkoutStep.set(step);
    if (step === 'delivery') {
      this.initDeliveryMap();
    }
  }

  async initDeliveryMap(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const loaded = await this.configService.loadGoogleMapsScript();
    this.mapsReady.set(loaded);
    if (!loaded || typeof google === 'undefined' || !google.maps) return;

    setTimeout(() => {
      const mapEl = document.getElementById('delivery-map');
      const inputEl = document.getElementById('delivery-address-input') as HTMLInputElement | null;
      if (!mapEl || !inputEl) return;

      const initialPos = {
        lat: this.deliveryForm.latitude || -1.286389,
        lng: this.deliveryForm.longitude || 36.817223
      };

      const map = new google.maps.Map(mapEl, {
        center: initialPos,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false
      });

      const marker = new google.maps.Marker({
        position: initialPos,
        map,
        draggable: true
      });

      const geocoder = new google.maps.Geocoder();

      const updateLocation = (lat: number, lng: number, formattedAddress?: string) => {
        this.deliveryForm.latitude = lat;
        this.deliveryForm.longitude = lng;
        this.deliveryForm.mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        if (formattedAddress) {
          this.deliveryForm.deliveryLocation = formattedAddress;
        }
      };

      // Places Autocomplete restricted to Kenya
      if (google.maps.places) {
        const autocomplete = new google.maps.places.Autocomplete(inputEl, {
          componentRestrictions: { country: 'ke' },
          fields: ['formatted_address', 'geometry', 'name']
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry?.location) return;
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          map.setCenter({ lat, lng });
          map.setZoom(16);
          marker.setPosition({ lat, lng });
          updateLocation(lat, lng, place.formatted_address || place.name);
        });
      }

      // Dragging the red pin updates coordinates & reverse-geocodes the street name
      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        const lat = pos.lat();
        const lng = pos.lng();
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
          const addr = status === 'OK' && results?.[0] ? results[0].formatted_address : undefined;
          updateLocation(lat, lng, addr);
        });
      });
    }, 100);
  }

  proceedToConfirm(): void {
    this.orderError.set('');
    if (
      !this.deliveryForm.fullName.trim() ||
      !this.deliveryForm.phone.trim() ||
      !this.deliveryForm.deliveryLocation.trim()
    ) {
      this.orderError.set('Please enter your full name, phone number, and delivery location.');
      return;
    }

    if (!this.deliveryForm.mapsUrl && this.deliveryForm.latitude && this.deliveryForm.longitude) {
      this.deliveryForm.mapsUrl = `https://www.google.com/maps?q=${this.deliveryForm.latitude},${this.deliveryForm.longitude}`;
    }

    this.checkoutStep.set('confirm');
  }

  submitOrder(): void {
    if (this.cart.items().length === 0) return;

    this.submittingOrder.set(true);
    this.orderError.set('');

    const payload = {
      customer: {
        fullName: this.deliveryForm.fullName.trim(),
        phone: this.deliveryForm.phone.trim(),
        email: this.deliveryForm.email.trim(),
        deliveryMethod: this.deliveryForm.deliveryMethod,
        county: this.deliveryForm.county,
        deliveryLocation: this.deliveryForm.deliveryLocation.trim(),
        notes: this.deliveryForm.notes.trim(),
        latitude: this.deliveryForm.latitude,
        longitude: this.deliveryForm.longitude,
        mapsUrl: this.deliveryForm.mapsUrl
      },
      items: this.cart.items(),
      subtotal: this.subtotal(),
      deliveryFee: this.deliveryFee(),
      totalAmount: this.grandTotal()
    };

    this.http.post<any>(`${this.getApiBase()}/orders`, payload).subscribe({
      next: (res) => {
        this.submittingOrder.set(false);
        this.orderSuccessNumber.set(res.order?.orderNumber || res.orderNumber || 'KLM-ORDER');
        const cartAny = this.cart as any;
        if (typeof cartAny.clearCart === 'function') {
          cartAny.clearCart();
        }
      },
      error: (err) => {
        this.submittingOrder.set(false);
        this.orderError.set(err.error?.message || 'Could not place order. Please try again.');
      }
    });
  }
}
