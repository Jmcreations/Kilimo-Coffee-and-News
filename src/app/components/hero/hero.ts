import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart-service';
import { AuthService } from '../../services/auth.service';
import { TickerService } from '../../services/ticker';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hero.html'
})
export class Hero {
  cart = inject(CartService);
  auth = inject(AuthService);
  tickerService = inject(TickerService);

  scrollToSection(sectionId: string, event: Event): void {
    const target = document.getElementById(sectionId);
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
