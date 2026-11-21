import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { StaffNav } from '../staff-nav/staff-nav';

export interface CoffeeOrderItem {
  region: string;
  coffeeForm: 'Roasted Beans' | 'Ground Coffee';
  roastLevel?: 'Medium Roast' | 'Dark Roast' | null;
  packSize: string;
  quantity: number;
  unitPrice: number;
}

export interface CoffeeOrder {
  _id: string;
  orderNumber: string;
  items: CoffeeOrderItem[];
  customer: {
    fullName: string;
    phone: string;
    email?: string;
    county: string;
    deliveryLocation: string;
    deliveryNotes?: string;
  };
  deliveryMethod: string;
  preferredDeliveryDate?: string;
  currency: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  status: 'Pending' | 'Confirmed' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  assignedRider?: { name: string; phone?: string } | null;
  createdAt: string;
}

@Component({
  selector: 'app-delivery-orders',
  standalone: true,
  imports: [CommonModule, StaffNav],
  templateUrl: './delivery-orders.html'
})
export class DeliveryOrders implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  orders = signal<CoffeeOrder[]>([]);
  loading = signal<boolean>(true);
  selectedStatus = signal<string>('All');
  updatingId = signal<string | null>(null);
  errorMessage = signal<string>('');

  readonly statusFilters = ['All', 'Pending', 'Confirmed', 'Out for Delivery', 'Delivered'];

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders(status: string = this.selectedStatus()): void {
    this.selectedStatus.set(status);
    this.loading.set(true);
    this.errorMessage.set('');

    const query = status !== 'All' ? `?status=${encodeURIComponent(status)}` : '';
    this.http.get<CoffeeOrder[]>(`${this.auth.getApiBase()}/orders${query}`).subscribe({
      next: (data) => {
        this.orders.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Could not load delivery orders.');
        this.loading.set(false);
      }
    });
  }

  updateStatus(orderId: string, newStatus: CoffeeOrder['status']): void {
    this.updatingId.set(orderId);
    this.http
      .patch<CoffeeOrder>(`${this.auth.getApiBase()}/orders/${orderId}/status`, { status: newStatus })
      .subscribe({
        next: (updated) => {
          this.orders.update((list) => list.map((o) => (o._id === orderId ? updated : o)));
          this.updatingId.set(null);
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to update delivery status.');
          this.updatingId.set(null);
        }
      });
  }

  getBadgeClasses(status: CoffeeOrder['status']): string {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Out for Delivery':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }
}
