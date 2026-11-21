import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart-service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  auth = inject(AuthService);
  cart = inject(CartService);
  private elementRef = inject(ElementRef);

  mobileMenuOpen = false;
  purchaseDropdownOpen = false;

  toggleMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (!this.mobileMenuOpen) {
      this.purchaseDropdownOpen = false;
    }
  }

  togglePurchaseDropdown(event: Event): void {
    event.stopPropagation();
    this.purchaseDropdownOpen = !this.purchaseDropdownOpen;
  }

  closeMenu(): void {
    this.mobileMenuOpen = false;
    this.purchaseDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.purchaseDropdownOpen = false;
    }
  }

  getStaffHomeRoute(): string {
    const role = this.auth.currentUser()?.role;
    if (role === 'admin') return '/admin';
    if (role === 'delivery') return '/delivery-orders';
    return '/post-news';
  }
}
