import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MilkOrderService } from '../../services/milk-order.service';

@Component({
  selector: 'app-manual-order-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './manual-order-dialog.component.html',
  styleUrl: './manual-order-dialog.component.css'
})
export class ManualOrderDialogComponent {
  orderForm: FormGroup;
  isSubmitting: boolean = false; // Flag to prevent duplicate submissions

  // List of users for dropdown (passed from parent)
  users: any[] = [];

  // Token types for dropdown
  tokenTypes: any[] = [];

  // Customer token balance for validation
  customerTokenBalance: any[] = [];
  availableTokenQty: number = 0;
  tokenQtyError: string = '';

  constructor(
    private milkOrderService: MilkOrderService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ManualOrderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.users = data?.users || [];
    this.orderForm = this.createForm();
    this.getTokenTypes();
    this.getCustomerTokenBalance();
  }

  createForm(): FormGroup {
    // Initialize with current IST date as default
    // The date picker will show today's date in IST timezone
    const currentISTDate = this.getCurrentISTDate();
    
    const form = this.fb.group({
      userId: ['', Validators.required],
      orderDate: [currentISTDate, Validators.required], // Set current IST date as default
      tokenType: ['', Validators.required],
      tokenQty: ['', [Validators.required, Validators.min(1), Validators.max(100)]]
    });

    // Add listeners for form changes to validate token quantity
    form.get('userId')?.valueChanges.subscribe(() => {
      this.onCustomerOrTokenTypeChange();
    });
    
    form.get('tokenType')?.valueChanges.subscribe(() => {
      this.onCustomerOrTokenTypeChange();
    });
    
    form.get('tokenQty')?.valueChanges.subscribe(() => {
      this.validateTokenQuantity();
    });

    return form;
  }

  onSubmit(): void {
    if (this.orderForm.valid && !this.isSubmitting) {
      this.isSubmitting = true; // Disable button to prevent duplicate clicks
      
      const formValue = this.orderForm.value;
      
      const orderData = {
        userId: formValue.userId,
        tokenId: formValue.tokenType,
        tokenQty: formValue.tokenQty,
        orderDate: this.formatDateToISO(formValue.orderDate),
        status: "Confirmed",
        createdBy: JSON.parse(localStorage.getItem('userDetails')!).userId,
        createdOn: this.formatDateTimeToIST(new Date())
      };

      this.milkOrderService.createManualOrder(orderData).subscribe({
        next: (response: any) => {
          if (response && response.result && response.result.data) {
            // Update cumulative token after successful order creation
            this.milkOrderService.updateCumulativeToken({
              userId: formValue.userId, 
              tokenId: formValue.tokenType, 
              tokenQty: formValue.tokenQty, 
              status: 'edit'
            }).subscribe({
              next: (res: any) => {
                this.isSubmitting = false; // Re-enable button
                if (res && res.result && res.result.data) {
                  this.dialogRef.close({
                    success: true,
                    data: response.result.data,
                    message: 'Manual order created successfully'
                  });
                }
              },
              error: (error: any) => {
                this.isSubmitting = false; // Re-enable button on error
                this.dialogRef.close({
                  success: false,
                  message: 'Order created but failed to update token balance'
                });
              }
            });
          } else {
            this.isSubmitting = false; // Re-enable button
            this.dialogRef.close({
              success: false,
              message: 'Failed to create manual order'
            });
          }
        },
        error: (error: any) => {
          this.isSubmitting = false; // Re-enable button
          console.error('Error creating manual order:', error);
          this.dialogRef.close({
            success: false,
            message: error.message || 'Failed to create manual order'
          });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  getTokenTypes(): void {
    this.milkOrderService.getTokens().subscribe({
      next: (response: any) => {
        if (response && response.result && response.result.data) {
          this.tokenTypes = response.result.data;
        }
      },
      error: (error: any) => {
        console.error('Error fetching token types:', error);
      }
    });
  }

  getCustomerTokenBalance(): void {
    this.milkOrderService.getCumulativeTokens().subscribe({
      next: (response: any) => {
        if (response && response.result && response.result.data) {
          this.customerTokenBalance = response.result.data;
          this.onCustomerOrTokenTypeChange();
        }
      },
      error: (error: any) => {
        console.error('Error fetching customer token balance:', error);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.orderForm.controls).forEach(key => {
      const control = this.orderForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Formats a date to YYYY-MM-DD format treating the input as IST date
   * This ensures the selected date is interpreted as IST regardless of browser timezone
   */
  private formatDateToISO(date: Date): string {
    if (!date) return '';
    
    // Treat the selected date as IST date (don't convert timezone)
    // Just extract the year, month, day from the selected date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
   * Formats a datetime to ISO string in IST timezone
   * Used for timestamps like createdOn
   */
  private formatDateTimeToIST(date: Date): string {
    if (!date) return '';
    
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60; // IST is UTC+5:30 in minutes
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + (istOffset * 60000));
    
    return istDate.toISOString();
  }

  /**
   * Gets the current date in IST timezone
   * Returns a Date object that represents "today" in IST
   */
  private getCurrentISTDate(): Date {
    // Get current time in IST
    const now = new Date();
    const istOffset = 5.5; // IST is UTC+5:30
    const istTime = new Date(now.getTime() + (istOffset * 60 * 60 * 1000));
    
    // Create a date object for today in IST (without timezone conversion for display)
    const istYear = istTime.getUTCFullYear();
    const istMonth = istTime.getUTCMonth();
    const istDay = istTime.getUTCDate();
    
    return new Date(istYear, istMonth, istDay);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.orderForm.get(fieldName);
    if (control?.hasError('required')) {
      switch (fieldName) {
        case 'userId':
          return 'Customer is required';
        case 'orderDate':
          return 'Order date is required';
        case 'tokenType':
          return 'Token type is required';
        case 'tokenQty':
          return 'Token quantity is required';
        default:
          return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
    }
    if (fieldName === 'tokenQty') {
      if (control?.hasError('insufficientTokens') || control?.hasError('noTokensAvailable')) {
        return this.tokenQtyError;
      }
      if (control?.hasError('min')) {
        return 'Token quantity must be at least 1';
      }
      if (control?.hasError('max')) {
        return 'Token quantity cannot exceed 100';
      }
    }
    return '';
  }

  getUserDisplayName(userId: number): string {
    const user = this.users.find(u => u.userId === userId);
    return user ? `${user.firstName} ${user.lastName}` : '';
  }

  onCustomerOrTokenTypeChange(): void {
    const userId = this.orderForm.get('userId')?.value;
    const tokenTypeId = this.orderForm.get('tokenType')?.value;
    
    if (userId && tokenTypeId) {
      this.updateAvailableTokenQuantity(userId, tokenTypeId);
    } else {
      this.availableTokenQty = 0;
      this.tokenQtyError = '';
    }
  }

  updateAvailableTokenQuantity(userId: number, tokenTypeId: number): void {
    const customer = this.customerTokenBalance.find(c => c.userId === userId);
    if (customer && customer.tokenDetails) {
      const tokenDetail = customer.tokenDetails.find((t: any) => t.tokenId === tokenTypeId);
      this.availableTokenQty = tokenDetail ? tokenDetail.tokenQty : 0;
    } else {
      this.availableTokenQty = 0;
    }
    this.validateTokenQuantity();
  }

  validateTokenQuantity(): void {
    const requestedQty = this.orderForm.get('tokenQty')?.value;
    
    if (requestedQty && this.availableTokenQty > 0) {
      if (requestedQty > this.availableTokenQty) {
        this.tokenQtyError = `Only ${this.availableTokenQty} tokens available`;
        this.orderForm.get('tokenQty')?.setErrors({ insufficientTokens: true });
      } else {
        this.tokenQtyError = '';
        // Remove the custom error if quantity is valid
        const control = this.orderForm.get('tokenQty');
        if (control?.hasError('insufficientTokens')) {
          const errors = { ...control.errors };
          delete errors['insufficientTokens'];
          control.setErrors(Object.keys(errors).length ? errors : null);
        }
      }
    } else if (requestedQty && this.availableTokenQty === 0) {
      this.tokenQtyError = 'No tokens available for this token type';
      this.orderForm.get('tokenQty')?.setErrors({ noTokensAvailable: true });
    } else {
      this.tokenQtyError = '';
    }
  }

  isCreateOrderEnabled(): boolean {
    return this.orderForm.valid && !this.isSubmitting && this.tokenQtyError === '';
  }
}