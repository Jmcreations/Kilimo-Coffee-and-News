import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TickerService } from '../../services/ticker';

@Component({
  selector: 'app-nce-ticker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nce-ticker.html',
  styleUrl: './nce-ticker.scss'
})
export class NceTicker implements OnInit {
  tickerService = inject(TickerService);

  ngOnInit(): void {
    this.tickerService.loadTicker();
  }
}
