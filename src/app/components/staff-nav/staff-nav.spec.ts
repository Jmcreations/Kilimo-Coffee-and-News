import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffNav } from './staff-nav';

describe('StaffNav', () => {
  let component: StaffNav;
  let fixture: ComponentFixture<StaffNav>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffNav],
    }).compileComponents();

    fixture = TestBed.createComponent(StaffNav);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
