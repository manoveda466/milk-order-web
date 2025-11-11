import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';

export const loginGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Check if user details exist in localStorage
  const userDetails = localStorage.getItem('userDetails');
  
  if (userDetails) {
    try {
      // Parse the user details to ensure it's valid JSON
      const parsedUserDetails = JSON.parse(userDetails);
      
      // Check if the parsed object has required properties
      if (parsedUserDetails && parsedUserDetails.userId) {
        // User is already authenticated, redirect to home
        router.navigate(['/home']);
        return false;
      }
    } catch (error) {
      // If JSON parsing fails, remove invalid data and allow access to login
      localStorage.removeItem('userDetails');
    }
  }
  
  // If no valid user details found, allow access to login page
  return true;
};