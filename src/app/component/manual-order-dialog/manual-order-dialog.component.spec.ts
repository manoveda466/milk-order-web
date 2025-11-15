import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualOrderDialogComponent } from './manual-order-dialog.component';

describe('ManualOrderDialogComponent', () => {
  let component: ManualOrderDialogComponent;
  let fixture: ComponentFixture<ManualOrderDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManualOrderDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManualOrderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});