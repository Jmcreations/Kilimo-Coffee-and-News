import { Component } from '@angular/core';

interface CoffeeGrade {
  grade: string;
  screenSize: string;
  flavor: string;
  region: string;
  image: string;
  premium: boolean;
}

@Component({
  selector: 'app-coffee-grades',
  standalone: true,
  templateUrl: './coffee-grades.html',
  styleUrl: './coffee-grades.scss'
})
export class CoffeeGradesComponent {
  hoveredGrade: string | null = null;

  coffeeGrades: CoffeeGrade[] = [
    {
      grade: 'AA',
      screenSize: '7.20mm+',
      flavor: 'Complex, wine-like acidity with bright citrus notes and full body',
      region: 'Nyeri, Kirinyaga, Murang\'a',
      image: 'https://images.unsplash.com/photo-1777984994623-6e96b0d6be43?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      premium: true,
    },
    {
      grade: 'AB',
      screenSize: '6.80mm - 7.19mm',
      flavor: 'Balanced with medium body, sweet berry notes and smooth finish',
      region: 'Central Kenya, Mt. Kenya Region',
      image: 'https://images.unsplash.com/photo-1774801935463-15275f0bcc8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      premium: true,
    },
    {
      grade: 'PB (Peaberry)',
      screenSize: '6.80mm+',
      flavor: 'Intense, concentrated flavor with enhanced sweetness and clarity',
      region: 'Kiambu, Embu',
      image: 'https://images.unsplash.com/photo-1733860442931-93f15b1baa66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      premium: true,
    },
    {
      grade: 'C',
      screenSize: '6.20mm - 6.79mm',
      flavor: 'Lighter body with mild acidity, subtle fruit notes',
      region: 'Various regions',
      image: 'https://images.unsplash.com/photo-1567613747256-9f97205d23d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      premium: false,
    },
    {
      grade: 'E (Elephant)',
      screenSize: '8.00mm+',
      flavor: 'Rare grade with robust character and distinctive profile',
      region: 'Limited availability',
      image: 'https://images.unsplash.com/photo-1733860474255-a6703e787cad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      premium: true,
    },
    {
      grade: 'TT',
      screenSize: 'Small beans from AA/AB',
      flavor: 'Light, delicate with good clarity despite smaller size',
      region: 'Secondary sorting',
      image: 'https://images.unsplash.com/photo-1774801935463-15275f0bcc8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      premium: false,
    },
  ];

  setHoveredGrade(grade: string | null) {
    this.hoveredGrade = grade;
  }
}