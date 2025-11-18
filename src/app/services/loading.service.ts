import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private dialogOpenSubject = new BehaviorSubject<boolean>(false);
  private snackbarOpenSubject = new BehaviorSubject<boolean>(false);
  private requestCount = 0;

  constructor() { }

  // Observable to expose loading state (hidden when dialog or snackbar is open)
  get isLoading$(): Observable<boolean> {
    return combineLatest([
      this.loadingSubject.asObservable(),
      this.dialogOpenSubject.asObservable(),
      this.snackbarOpenSubject.asObservable()
    ]).pipe(
      map(([loading, dialogOpen, snackbarOpen]) => loading && !dialogOpen && !snackbarOpen)
    );
  }

  // Get current loading state value
  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  // Show loading
  show(): void {
    this.requestCount++;
    if (this.requestCount === 1) {
      this.loadingSubject.next(true);
    }
  }

  // Hide loading
  hide(): void {
    this.requestCount = Math.max(0, this.requestCount - 1);
    if (this.requestCount === 0) {
      this.loadingSubject.next(false);
    }
  }

  // Force hide loading (useful for error scenarios)
  forceHide(): void {
    this.requestCount = 0;
    this.loadingSubject.next(false);
  }

  // Dialog state management
  setDialogOpen(isOpen: boolean): void {
    this.dialogOpenSubject.next(isOpen);
  }

  // Get current dialog state
  get isDialogOpen(): boolean {
    return this.dialogOpenSubject.value;
  }

  // Snackbar state management
  setSnackbarOpen(isOpen: boolean): void {
    this.snackbarOpenSubject.next(isOpen);
  }

  // Get current snackbar state
  get isSnackbarOpen(): boolean {
    return this.snackbarOpenSubject.value;
  }
}