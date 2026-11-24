// src/app/components/coffee-grades/coffee-grades.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface CoffeeGradeItem {
  code: string;
  name: string;
  screenSize: string;
  profile: string;
  image: string;
  tag: string;
}

@Component({
  selector: 'app-coffee-grades',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './coffee-grades.html',
  styleUrl: './coffee-grades.scss'
})
export class CoffeeGrades {
  grades: CoffeeGradeItem[] = [
    {
      code: 'AA',
      name: 'Kenya AA',
      screenSize: 'Screen 17/18 (7.2mm+)',
      profile: 'Flagship large bean with bright blackcurrant acidity, floral aromatics, and full winey body.',
      image: '/Images/grade-aa.jpg',
      tag: 'Top Export Auction Grade'
    },
    {
      code: 'AB',
      name: 'Kenya AB',
      screenSize: 'Screen 15/16 (6.2–6.8mm)',
      profile: 'Balanced blend of A and B screens offering vibrant citrus notes, rich sweetness, and crisp finish.',
      image: '/Images/grade-ab.jpg',
      tag: 'Most Traded Lot'
    },
    {
      code: 'PB',
      name: 'Peaberry (PB)',
      screenSize: 'Single Oval Bean',
      profile: 'Naturally occurring single-seed cherry concentrating complex berry sweetness and high aroma.',
      image: '/Images/grade-pb.jpg',
      tag: 'Specialty Micro-Lot'
    },
    {
      code: 'C',
      name: 'Kenya C',
      screenSize: 'Screen 12–14',
      profile: 'Clean, medium-bodied cup ideal for smooth espresso blends and consistent daily roasting.',
      image: '/Images/grade-c.jpg',
      tag: 'Commercial Blend Favorite'
    },
    {
      code: 'E',
      name: 'Elephant (E)',
      screenSize: 'Screen 20+ Giant Bean',
      profile: 'Rare extra-large twin beans sorted separately for bold, heavy-bodied specialty roasts.',
      image: '/Images/grade-e.jpg',
      tag: 'Rare Large Screen'
    },
    {
      code: 'TT',
      name: 'Kenya TT',
      screenSize: 'Light Density Air-Sorted',
      profile: 'Air-separated lighter beans from AA and AB lots delivering mild acidity and approachable sweetness.',
      image: '/Images/grade-tt.jpg',
      tag: 'Value Roast Grade'
    }
  ];
}
