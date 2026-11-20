import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-data-teaser',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './data-teaser.html',
  styleUrl: './data-teaser.scss',
})
export class DataTeaser {}
