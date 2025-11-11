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
  selector: 'app-token-dialog',
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
  templateUrl: './token-dialog.component.html',
  styleUrl: './token-dialog.component.css'
})
export class TokenDialogComponent {
  tokenForm: FormGroup;

  // List of users for dropdown (passed from parent)
  users: any[] = [];

  // Token types for dropdown
  tokenTypes: any[] = [];

  constructor(
    private milkOrderService: MilkOrderService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TokenDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.users = data?.users || [];
    this.tokenForm = this.createForm();
    
    
    this.getTokenTypes();
  }

  createForm(): FormGroup {
    return this.fb.group({
      userId: ['', Validators.required],
      tokenType: ['', Validators.required],
      tokenQty: ['', [Validators.required, Validators.min(1), Validators.max(100)]]
    });
  }

  populateForm(token: any): void {
    this.tokenForm.patchValue({
      userId: this.users.find(u => u.name === token.name)?.id || '',
      tokenType: token.tokenType,
      tokenQty: token.tokenQty
    });
  }

  onSubmit(): void {
    if (this.tokenForm.valid) {
      const formValue = this.tokenForm.value;
      
      const tokenData = {
        userId: formValue.userId,
        tokenId: formValue.tokenType,
        Qty: formValue.tokenQty,
        issueDate: new Date().toISOString().split('T')[0]
      };

      this.milkOrderService.createCustomerToken(tokenData).subscribe({
        next: (response) => {
          if(response && response.result.data){
            this.milkOrderService.updateCumulativeToken({userId: formValue.userId, tokenQty: formValue.tokenQty, status: 'add'}).subscribe({
              next: (res) => {
                if(res && res.result.data){
                  this.dialogRef.close();
                }
              },
              error: () => {
                
              }
            });
            
          }
        },
        error: (error) => {
          console.error('Error creating token:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  getTokenTypes(): void {
    this.milkOrderService.getTokens().subscribe({
      next: (response) => {
        this.tokenTypes = response.result.data;
      },
      error: (error) => {
        console.error('Error fetching token types:', error);
      }
    });
  }

  

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.tokenForm.controls).forEach(key => {
      const control = this.tokenForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.tokenForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (control?.hasError('min') && fieldName === 'tokenQty') {
      return 'Token quantity must be at least 1';
    }
    if (control?.hasError('max') && fieldName === 'tokenQty') {
      return 'Token quantity cannot exceed 100';
    }
    return '';
  }

  getUserDisplayName(userId: number): string {
    return this.users.find(u => u.id === userId)?.name || '';
  }
}