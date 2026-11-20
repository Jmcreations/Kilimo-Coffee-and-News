import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkSection } from './network-section';

describe('NetworkSection', () => {
  let component: NetworkSection;
  let fixture: ComponentFixture<NetworkSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetworkSection],
    }).compileComponents();

    fixture = TestBed.createComponent(NetworkSection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
