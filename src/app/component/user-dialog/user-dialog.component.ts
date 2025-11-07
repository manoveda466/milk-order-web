import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TextFieldModule } from '@angular/cdk/text-field';

@Component({
  selector: 'app-user-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    TextFieldModule
  ],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.css'
})
export class UserDialogComponent {
  userForm: FormGroup;
  isEditMode: boolean = false;

  areas: string[] = [
    'Downtown',
    'Uptown',
    'Suburbs',
    'Eastside',
    'Westside',
    'North District',
    'South District',
    'City Center',
    'Business District',
    'Residential Area'
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEditMode = !!data?.user;
    this.userForm = this.createForm();
    
    if (this.isEditMode && data.user) {
      this.populateForm(data.user);
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      mobileNo: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      area: ['', Validators.required],
      address: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  populateForm(user: any): void {
    const nameParts = user.name.split(' ');
    this.userForm.patchValue({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      mobileNo: user.mobileNo.replace('+91 ', ''),
      area: user.area,
      address: user.address
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      const userData = {
        id: this.isEditMode ? this.data.user.id : Date.now(),
        name: `${formValue.firstName} ${formValue.lastName}`,
        mobileNo: `+91 ${formValue.mobileNo}`,
        area: formValue.area,
        address: formValue.address,
        isActive: this.isEditMode ? this.data.user.isActive : true
      };

      this.dialogRef.close(userData);
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.userForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${minLength} characters`;
    }
    if (control?.hasError('pattern') && fieldName === 'mobileNo') {
      return 'Please enter a valid 10-digit mobile number starting with 6-9';
    }
    return '';
  }
}
