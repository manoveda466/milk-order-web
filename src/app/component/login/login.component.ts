import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  mobileNumber: string = '';
  otp: string = '';
  showOtpScreen: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  otpTimer: number = 30;
  canResendOtp: boolean = false;
  private timerInterval: any;

  constructor(private router: Router) {}

  // Validate mobile number (10 digits, starting with 6-9)
  isValidMobileNumber(): boolean {
    if (!this.mobileNumber) return false;
    const mobileRegex = /^[6-9]\d{9}$/;
    const isValid = mobileRegex.test(this.mobileNumber);
    console.log('Validating mobile:', this.mobileNumber, 'Length:', this.mobileNumber.length, 'Valid:', isValid);
    return isValid;
  }

  // Alternative validation for testing - accepts any 10-digit number
  isValidMobileNumberTest(): boolean {
    return !!(this.mobileNumber && this.mobileNumber.length === 10);
  }

  // Send OTP to mobile number
  sendOtp(): void {
    if (!this.isValidMobileNumber()) {
      this.errorMessage = 'Please enter a valid 10-digit mobile number';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Simulate API call to send OTP
    setTimeout(() => {
      this.isLoading = false;
      this.showOtpScreen = true;
      this.successMessage = `OTP sent to +91 ${this.mobileNumber}`;
      this.startOtpTimer();
    }, 2000);
  }

  // Verify OTP
  verifyOtp(): void {
    if (!this.otp || this.otp.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit OTP';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Simulate API call to verify OTP
    setTimeout(() => {
      this.isLoading = false;
      
      // For demo purposes, accept any 6-digit OTP
      if (this.otp.length === 6) {
        this.successMessage = 'Login successful! Redirecting to dashboard...';
        this.clearTimer();
        
        // Navigate to home page after successful login
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1500);
        
        console.log('User logged in successfully with mobile:', this.mobileNumber);
      } else {
        this.errorMessage = 'Invalid OTP. Please try again.';
      }
    }, 1500);
  }

  // Resend OTP
  resendOtp(): void {
    if (!this.canResendOtp) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.otp = '';

    // Simulate API call to resend OTP
    setTimeout(() => {
      this.isLoading = false;
      this.successMessage = `OTP resent to +91 ${this.mobileNumber}`;
      this.startOtpTimer();
    }, 1000);
  }

  // Start OTP countdown timer
  startOtpTimer(): void {
    this.otpTimer = 30;
    this.canResendOtp = false;
    this.clearTimer();

    this.timerInterval = setInterval(() => {
      this.otpTimer--;
      if (this.otpTimer <= 0) {
        this.canResendOtp = true;
        this.clearTimer();
      }
    }, 1000);
  }

  // Clear timer
  clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Go back to mobile number input
  goBack(): void {
    this.showOtpScreen = false;
    this.otp = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.clearTimer();
  }

  // Handle mobile number input (only allow digits)
  onMobileNumberInput(event: any): void {
    const value = event.target.value.replace(/\D/g, '');
    this.mobileNumber = value.slice(0, 10);
    this.errorMessage = '';
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
