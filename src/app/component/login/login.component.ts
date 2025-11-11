import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MilkOrderService } from '../../services/milk-order.service';
@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnDestroy {
  mobileNumber: string = '';
  otp: string = '';
  showOtpScreen: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  otpTimer: number = 30;
  canResendOtp: boolean = false;
  private timerInterval: any;
  customerDetails: any;

  constructor(
    private router: Router,
    private milkOrderService: MilkOrderService
  ) {}

  // Validate mobile number (10 digits, starting with 6-9)
  isValidMobileNumber(): boolean {
    if (!this.mobileNumber) return false;
    const mobileRegex = /^[6-9]\d{9}$/;
    const isValid = mobileRegex.test(this.mobileNumber);
    return isValid;
  }

  checkValidUser() {
    if (!this.isValidMobileNumber()) {
      this.errorMessage = 'Please enter a valid 10-digit mobile number';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    
   this.milkOrderService.checkValidUser(this.mobileNumber).subscribe({
      next: (response) => {
        if(response && response.result.data.length > 0 && response.result.data[0].userId > 0){
          this.showOtpScreen = true;
          this.successMessage = `User is valid. Sending OTP to +91 ${this.mobileNumber}`;
          this.getUserDetailsById(response.result.data[0].userId);
          
          const otpData = {
            "userId": response.result.data[0].userId,
            "otp": null,
            "validity": new Date(),
            "createdOn": new Date()
          };
          this.sendOTP(otpData);
          this.isLoading = false;
        }
        else{
          this.isLoading = false;
          this.errorMessage = 'User is not valid. Please try again.';
          this.showOtpScreen = false;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'User is not valid. Please try again.';
      }
    });
  }

  getUserDetailsById(userId: number) {
    this.milkOrderService.getUserDetailsById(userId).subscribe({
        next: (response) => {
          this.isLoading = false; 
          this.startOtpTimer();
         localStorage.setItem('userDetails', JSON.stringify(response.result.data[0]));
        }
        ,
        error: (error) => {
          this.isLoading = false;
          
        }
      });
    }
    

  sendOTP(data: any) {
    this.milkOrderService.sendOTP(data).subscribe({
        next: (response) => {
          this.isLoading = false; 
          this.startOtpTimer();
          this.successMessage = 'OTP sent successfully!';
        }
        ,
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Failed to send OTP. Please try again.';
        }
      });
    }

  


  // Clear timer
  clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }


  // Verify OTP
  verifyOtp() {
    let userId = localStorage.getItem('userDetails') ? JSON.parse(localStorage.getItem('userDetails')!).userId : 0;
    let otp = this.otp.trim();
    this.milkOrderService.verifyOTP(userId, otp.toString()).subscribe({
        next: (response) => {
          if(response && response.result.data){
            this.isLoading = false; 
            this.router.navigate(['/home']);
          } else{
            this.errorMessage = 'Invalid OTP. Please try again.';
            this.successMessage = '';
          }
        }
        ,
        error: (error) => {
          this.isLoading = false;
          
        }
      });
  }

  // Resend OTP
  resendOtp(): void {
    if (!this.canResendOtp) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.otp = '';
    
    // Reset timer state
    this.otpTimer = 30;
    this.canResendOtp = false;
    
    // Call the API to resend OTP
   const otpData = {
            "userId": localStorage.getItem('userDetails') ? JSON.parse(localStorage.getItem('userDetails')!).userId : 0,
            "otp": null,
            "validity": new Date(),
            "createdOn": new Date()
          };
    this.sendOTP(otpData);
  }

  // Start OTP countdown timer
  startOtpTimer(): void {
    this.clearTimer(); // Clear any existing timer
    this.otpTimer = 30;
    this.canResendOtp = false;
    
    this.timerInterval = setInterval(() => {
      this.otpTimer--;
      
      if (this.otpTimer <= 0) {
        this.canResendOtp = true;
        this.clearTimer();
      }
    }, 1000);
  }

  // Go back to mobile number input
  goBack(): void {
    this.showOtpScreen = false;
    this.otp = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.clearTimer();
    this.otpTimer = 30;
    this.canResendOtp = false;
  }

  // Handle mobile number input (only allow digits)
  onMobileNumberInput(event: any): void {
    // Remove all non-digit characters
    const value = event.target.value.replace(/\D/g, '');
    // Limit to 10 digits maximum
    this.mobileNumber = value.slice(0, 10);
    // Update the input field to reflect the cleaned value
    event.target.value = this.mobileNumber;
    // Clear any existing error message
    this.errorMessage = '';
  }

  // Prevent non-numeric characters from being typed
  onKeyPress(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    // Allow only digits (0-9), backspace, delete, tab, escape, enter
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }

  // Handle OTP input (only allow digits)
  onOtpInput(event: any): void {
    const value = event.target.value.replace(/\D/g, '');
    this.otp = value.slice(0, 6);
    this.errorMessage = '';
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }
}
