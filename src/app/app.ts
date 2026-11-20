import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { NceTicker } from './components/nce-ticker/nce-ticker';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, NceTicker],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  title = 'AnCoffee';
}