import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Check if user details exist in localStorage
  const userId = localStorage.getItem('userId');
  const roleId = localStorage.getItem('roleId');
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  
  if (userId && roleId && roleId == "1" && isLoggedIn === 'true') {
    try {
      
      // Check if the parsed object has required properties (you can customize this check)
      if (userId && roleId == "1") {
        return true; // User is authenticated, allow access
      }
    } catch (error) {
      // If JSON parsing fails, remove invalid data and redirect to login
      localStorage.removeItem('userId');
      localStorage.removeItem('roleId');
      localStorage.removeItem('userDetails');
      localStorage.removeItem('isLoggedIn');
    }
  }
  localStorage.removeItem('userId');
  localStorage.removeItem('roleId');
  localStorage.removeItem('userDetails');
  localStorage.removeItem('isLoggedIn');
  
  // If no valid user details found, redirect to login
  router.navigate(['/login']);
  return false;
};