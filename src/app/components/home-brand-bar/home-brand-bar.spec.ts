import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeBrandBar } from './home-brand-bar';

describe('HomeBrandBar', () => {
  let component: HomeBrandBar;
  let fixture: ComponentFixture<HomeBrandBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeBrandBar],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeBrandBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
