import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NceTicker } from './nce-ticker';

describe('NceTicker', () => {
  let component: NceTicker;
  let fixture: ComponentFixture<NceTicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NceTicker],
    }).compileComponents();

    fixture = TestBed.createComponent(NceTicker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
