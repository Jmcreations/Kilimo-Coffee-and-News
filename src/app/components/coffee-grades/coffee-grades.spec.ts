import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoffeeGrades } from './coffee-grades';

describe('CoffeeGrades', () => {
  let component: CoffeeGrades;
  let fixture: ComponentFixture<CoffeeGrades>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoffeeGrades],
    }).compileComponents();

    fixture = TestBed.createComponent(CoffeeGrades);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
