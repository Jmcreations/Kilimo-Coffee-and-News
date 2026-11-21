import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.scss'
})
export class Hero {
  private elementRef = inject(ElementRef);
  purchaseDropdownOpen = false;

  togglePurchaseDropdown(event: Event): void {
    event.stopPropagation();
    this.purchaseDropdownOpen = !this.purchaseDropdownOpen;
  }

  closePurchaseDropdown(): void {
    this.purchaseDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.purchaseDropdownOpen = false;
    }
  }
}
