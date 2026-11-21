import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseCoffee } from './purchase-coffee';

describe('PurchaseCoffee', () => {
  let component: PurchaseCoffee;
  let fixture: ComponentFixture<PurchaseCoffee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseCoffee],
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseCoffee);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
