import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InquiryPage } from './inquiry-page';

describe('InquiryPage', () => {
  let component: InquiryPage;
  let fixture: ComponentFixture<InquiryPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InquiryPage],
    }).compileComponents();

    fixture = TestBed.createComponent(InquiryPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
