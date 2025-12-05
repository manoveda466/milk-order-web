import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-overlay" *ngIf="isLoading$ | async" [class.fixed]="overlay">
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text" *ngIf="message">{{ message }}</div>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(2px);
    }

    .loading-overlay.fixed {
      position: fixed;
      background-color: rgba(255, 255, 255, 0.9);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e0f7fa;
      border-top: 4px solid #00b4d8;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loading-text {
      font-size: 14px;
      color: #00b4d8;
      font-weight: 500;
      text-align: center;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .loading-spinner {
        width: 32px;
        height: 32px;
        border-width: 3px;
      }
      
      .loading-text {
        font-size: 12px;
      }
    }
  `]
})
export class LoadingComponent {
  @Input() message: string = '';
  @Input() overlay: boolean = false; // If true, uses fixed positioning for full screen overlay

  isLoading$: Observable<boolean>;

  constructor(private loadingService: LoadingService) {
    this.isLoading$ = this.loadingService.isLoading$;
  }
}