import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { NceTicker } from './components/nce-ticker/nce-ticker';
import { NavigationHistoryService } from './services/navigation-history';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NceTicker],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  title = 'Kilimo Coffee and News';
  private navHistory = inject(NavigationHistoryService);
}
