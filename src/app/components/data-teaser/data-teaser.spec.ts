import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataTeaser } from './data-teaser';

describe('DataTeaser', () => {
  let component: DataTeaser;
  let fixture: ComponentFixture<DataTeaser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTeaser],
    }).compileComponents();

    fixture = TestBed.createComponent(DataTeaser);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
