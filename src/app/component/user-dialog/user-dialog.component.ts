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
import { MilkOrderService } from '../../services/milk-order.service';

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

  areas: any[] = [];

  constructor(
    private milkOrderService: MilkOrderService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEditMode = !!data?.user;
    this.userForm = this.createForm();
    
    if (this.isEditMode && data.user) {
      this.populateForm(data.user);
    }
    this.getAreas();
  }

  createForm(): FormGroup {
    return this.fb.group({
      userId: [''], // Hidden field for updates
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(1)]],
      mobileNo: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      area: ['', Validators.required],
      address: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  populateForm(user: any): void {
    this.userForm.patchValue({
      userId: user.userId || user.id, // Support both userId and id field names
      firstName: user.firstName,
      lastName: user.lastName,
      mobileNo: user.mobile,
      area: user.areaId,
      address: user.address
    });
  }

  onSubmit(isEditMode: boolean): void {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      const userData: any = {
        userId: formValue.userId == '' ? 0 : formValue.userId,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        mobile: formValue.mobileNo.toString(),
        areaId: formValue.area,
        address: formValue.address,
        isActive: true,
        createdBy: JSON.parse(localStorage.getItem('userDetails')!).userId.toString()
      };

      // Add userId for update operations
      if (isEditMode && formValue.userId) {
        userData.userId = formValue.userId;
      }
      
      if(!isEditMode){
        this.milkOrderService.createCustomer(userData).subscribe({
          next: (response) => {
            if (response && response.result && response.result.data) {
              this.dialogRef.close({
                success: true,
                data: response.result.data,
                message: 'Customer created successfully'
              });
            } else {
              this.dialogRef.close({
                success: false,
                message: 'Failed to create customer'
              });
            }
          },
          error: (error) => {
            console.error('Error creating customer:', error);
            this.dialogRef.close({
              success: false,
              message: error.message || 'Failed to create customer'
            });
          }
        });   
      }else{
          this.milkOrderService.updateCustomer(userData).subscribe({
          next: (response) => {
            if (response && response.result && response.result.data) {
              this.dialogRef.close({
                success: true,
                data: response.result.data,
                message: 'Customer updated successfully'
              });
            } else {
              this.dialogRef.close({
                success: false,
                message: 'Failed to update customer'
              });
            }
          },
          error: (error) => {
            console.error('Error updating customer:', error);
            this.dialogRef.close({
              success: false,
              message: error.message || 'Failed to update customer'
            });
          }
        });
      }
      
    } else {
      this.markFormGroupTouched();
    }
  }

  getAreas(): void {
   this.milkOrderService.getAreas().subscribe({
        next: (response) => {
          if (response && response.result && response.result.data.length) {
            this.areas = response.result.data;
          } 
        },
        error: (error) => {
         
        }
      });
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

  // Handle mobile number input (only allow digits)
  onMobileNumberInput(event: any): void {
    // Remove all non-digit characters
    const value = event.target.value.replace(/\D/g, '');
    // Limit to 10 digits maximum
    const cleanValue = value.slice(0, 10);
    // Update the form control
    this.userForm.get('mobileNo')?.setValue(cleanValue);
    // Update the input field to reflect the cleaned value
    event.target.value = cleanValue;
  }

  // Prevent non-numeric characters from being typed
  onKeyPress(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    // Allow only digits (0-9), backspace, delete, tab, escape, enter
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }

  getErrorMessage(fieldName: string): string {
    const control = this.userForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    
    if (control?.hasError('pattern') && fieldName === 'mobileNo') {
      return 'Please enter a valid 10-digit mobile number starting with 6-9';
    }
    return '';
  }
}
