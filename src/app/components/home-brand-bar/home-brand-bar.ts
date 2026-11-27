import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart-service';

@Component({
  selector: 'app-home-brand-bar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl:'./home-brand-bar.html'
})
export class HomeBrandBar {
  @Input() currentPage: 'shop' | 'news' | 'detail' = 'news';
  cart = inject(CartService);
}
