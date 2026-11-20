import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TickerItem {
  grade: string;
  price: number;
  change: number;
  unit: string;
}

@Component({
  selector: 'app-nce-ticker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nce-ticker.html',
  styleUrls: ['./nce-ticker.scss']
})
export class NceTicker {
  nceData: TickerItem[] = [
    { grade: 'AA', price: 612.50, change: +8.25, unit: 'USD/50kg' },
    { grade: 'AB', price: 548.00, change: +5.10, unit: 'USD/50kg' },
    { grade: 'PB', price: 590.75, change: -3.50, unit: 'USD/50kg' },
    { grade: 'C',  price: 420.00, change: 0,     unit: 'USD/50kg' },
    { grade: 'E',  price: 645.00, change: +12.00, unit: 'USD/50kg' },
    { grade: 'TT', price: 390.50, change: -1.25, unit: 'USD/50kg' },
  ];

  // Duplicate for seamless loop
  get items(): TickerItem[] {
    return [...this.nceData, ...this.nceData, ...this.nceData, ...this.nceData];
  }
}
