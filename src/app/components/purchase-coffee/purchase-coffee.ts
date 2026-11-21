import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  CartService,
  CoffeeForm,
  CoffeeRegion,
  PackSize,
  RoastLevel
} from '../../services/cart-service';

interface RegionalCoffeeProduct {
  region: CoffeeRegion;
  displayName: string;
  elevation: string;
  tastingNotes: string;
  description: string;
  basePrice500g: number; // KES
  image: string;
  badge: string;
}

@Component({
  selector: 'app-purchase-coffee',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './purchase-coffee.html'
})
export class PurchaseCoffee {
  cart = inject(CartService);

  readonly regions: RegionalCoffeeProduct[] = [
    {
      region: 'Kirinyaga',
      displayName: 'Kirinyaga Slopes Reserve',
      elevation: '1,700 – 1,900m ASL',
      tastingNotes: 'Blackcurrant, Hibiscus, Cane Sugar',
      description: 'Volcanic red loam lots from Mount Kenya’s southern slopes with intense berry brightness.',
      basePrice500g: 1650,
      image: '/Images/Farming-Innovation.jpg',
      badge: 'Best Seller'
    },
    {
      region: 'Nyeri',
      displayName: 'Nyeri Highland AA Select',
      elevation: '1,750 – 2,000m ASL',
      tastingNotes: 'Grapefruit, Red Currant, Dark Cocoa',
      description: 'Washed SL28 and SL34 varietals prized for complex wine-like acidity and syrupy body.',
      basePrice500g: 1700,
      image: '/Images/Cooperative-news.jpg',
      badge: 'Estate Lot'
    },
    {
      region: 'Muranga',
      displayName: "Murang'a Ridge Cooperative",
      elevation: '1,650 – 1,850m ASL',
      tastingNotes: 'Caramel, Mandarin, Toasted Almond',
      description: 'Sweet, balanced smallholder lots processed with crystal-clear Aberdare mountain water.',
      basePrice500g: 1550,
      image: '/Images/Market-Report.jpg',
      badge: 'Cooperative Direct'
    },
    {
      region: 'Kiambu',
      displayName: 'Kiambu Heritage Estate',
      elevation: '1,550 – 1,750m ASL',
      tastingNotes: 'Milk Chocolate, Roasted Hazelnut, Plum',
      description: 'Classic Central Kenya estate coffee delivering rich body and smooth everyday balance.',
      basePrice500g: 1500,
      image: '/Images/Trade-Policies.jpg',
      badge: 'Local Favorite'
    },
    {
      region: 'Kericho',
      displayName: 'Kericho Rift Valley Roast',
      elevation: '1,800 – 2,100m ASL',
      tastingNotes: 'Bergamot, Honey, Stone Fruit',
      description: 'High-altitude western highland beans slow-matured for aromatic clarity and floral sweetness.',
      basePrice500g: 1600,
      image: '/Images/Farming-Innovation.jpg',
      badge: 'High Altitude'
    },
    {
      region: 'Nandi',
      displayName: 'Nandi Hills Single Origin',
      elevation: '1,850 – 2,050m ASL',
      tastingNotes: 'Apricot, Brown Sugar, Clove',
      description: 'Rich volcanic forest soil harvest offering warm spice undertones and clean sweetness.',
      basePrice500g: 1600,
      image: '/Images/Cooperative-news.jpg',
      badge: 'Limited Harvest'
    },
    {
      region: 'Machakos',
      displayName: 'Machakos Mua Hills Peaberry Blend',
      elevation: '1,500 – 1,700m ASL',
      tastingNotes: 'Dark Chocolate, Dried Fig, Molasses',
      description: 'Sun-kissed eastern hills coffee ideal for bold espresso shots and full-bodied filter brews.',
      basePrice500g: 1450,
      image: '/Images/Market-Report.jpg',
      badge: 'Rich Body'
    }
  ];

  // Filter & Active Configurator State
  selectedRegionFilter = signal<CoffeeRegion | 'All'>('All');
  activeProduct = signal<RegionalCoffeeProduct>(this.regions[0]);

  selectedForm = signal<CoffeeForm>('Roasted Beans');
  selectedRoast = signal<'Medium Roast' | 'Dark Roast'>('Medium Roast');
  selectedPack = signal<PackSize>('500g');
  quantity = signal<number>(1);
  addedBanner = signal<string>('');

  // Checkout & Order Receipt State
  checkoutStep = signal<'cart' | 'delivery' | 'confirmed'>('cart');
  submittingOrder = signal<boolean>(false);
  checkoutError = signal<string>('');
  confirmedOrder = signal<any | null>(null);

  deliveryForm = {
    fullName: '',
    phone: '',
    email: '',
    county: 'Nairobi',
    deliveryLocation: '',
    deliveryMethod: 'Doorstep Delivery' as 'Doorstep Delivery' | 'Pickup Station',
    preferredDeliveryDate: '',
    deliveryNotes: ''
  };

  readonly kenyanCounties = [
    'Nairobi',
    'Kiambu',
    'Nyeri',
    'Kirinyaga',
    "Murang'a",
    'Nakuru',
    'Mombasa',
    'Kisumu',
    'Uasin Gishu',
    'Kericho',
    'Nandi',
    'Machakos',
    'Other County'
  ];

  filteredProducts = computed(() => {
    const filter = this.selectedRegionFilter();
    return filter === 'All'
      ? this.regions
      : this.regions.filter((r) => r.region === filter);
  });

  currentUnitPrice = computed(() => {
    const base = this.activeProduct().basePrice500g;
    const pack = this.selectedPack();
    if (pack === '250g') return Math.round(base * 0.55);
    if (pack === '1kg') return Math.round(base * 1.9);
    return base;
  });

  deliveryFee = computed(() => {
    if (this.cart.subtotal() === 0) return 0;
    if (this.deliveryForm.deliveryMethod === 'Pickup Station') return 150;
    return this.cart.subtotal() >= 5000 ? 0 : 350;
  });

  grandTotal = computed(() => this.cart.subtotal() + this.deliveryFee());

  selectProductForConfig(product: RegionalCoffeeProduct): void {
    this.activeProduct.set(product);
    this.quantity.set(1);
    this.addedBanner.set('');
    const el = document.getElementById('coffee-configurator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  setCoffeeForm(form: CoffeeForm): void {
    this.selectedForm.set(form);
  }

  addConfiguredToCart(): void {
    const prod = this.activeProduct();
    const form = this.selectedForm();
    const roast: RoastLevel = form === 'Roasted Beans' ? this.selectedRoast() : null;

    this.cart.addItem({
      region: prod.region,
      coffeeForm: form,
      roastLevel: roast,
      packSize: this.selectedPack(),
      quantity: this.quantity(),
      unitPrice: this.currentUnitPrice(),
      image: prod.image
    });

    const roastLabel = roast ? ` (${roast})` : '';
    this.addedBanner.set(
      `Added ${this.quantity()} × ${prod.region} ${form}${roastLabel} [${this.selectedPack()}] to your cart.`
    );
    this.checkoutStep.set('cart');
    this.cart.drawerOpen.set(true);
  }

  openCartDrawer(step: 'cart' | 'delivery' = 'cart'): void {
    this.checkoutError.set('');
    this.checkoutStep.set(step);
    this.cart.drawerOpen.set(true);
  }

  submitCoffeeOrder(): void {
    this.checkoutError.set('');

    if (
      !this.deliveryForm.fullName.trim() ||
      !this.deliveryForm.phone.trim() ||
      !this.deliveryForm.deliveryLocation.trim()
    ) {
      this.checkoutError.set('Please enter your full name, phone number, and delivery address.');
      return;
    }

    if (this.cart.items().length === 0) {
      this.checkoutError.set('Your coffee cart is empty.');
      return;
    }

    this.submittingOrder.set(true);

    const payload = {
      items: this.cart.items().map((i) => ({
        region: i.region,
        coffeeForm: i.coffeeForm,
        roastLevel: i.roastLevel,
        packSize: i.packSize,
        quantity: i.quantity,
        unitPrice: i.unitPrice
      })),
      customer: {
        fullName: this.deliveryForm.fullName.trim(),
        phone: this.deliveryForm.phone.trim(),
        email: this.deliveryForm.email.trim(),
        county: this.deliveryForm.county,
        deliveryLocation: this.deliveryForm.deliveryLocation.trim(),
        deliveryNotes: this.deliveryForm.deliveryNotes.trim()
      },
      deliveryMethod: this.deliveryForm.deliveryMethod,
      preferredDeliveryDate: this.deliveryForm.preferredDeliveryDate,
      deliveryFee: this.deliveryFee()
    };

    this.cart.placeOrder(payload).subscribe({
      next: (savedOrder) => {
        this.submittingOrder.set(false);
        this.confirmedOrder.set(savedOrder);
        this.cart.clearCart();
        this.checkoutStep.set('confirmed');
      },
      error: (err) => {
        this.submittingOrder.set(false);
        this.checkoutError.set(
          err.error?.message || 'Could not submit your order. Please try again.'
        );
      }
    });
  }
}
