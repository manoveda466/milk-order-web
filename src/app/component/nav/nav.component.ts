import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoadingComponent } from '../loading/loading.component';
import { LoadingService } from '../../services/loading.service';
import { RouterOutlet } from '@angular/router';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  active: boolean;
}

@Component({
  selector: 'app-nav',
  imports: [
    CommonModule,
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule,
    LoadingComponent,
    RouterOutlet
  ],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css'
})
export class NavComponent implements OnInit, OnDestroy {
  // Sidebar state
  sidebarCollapsed: boolean = true;
  private routerSubscription: Subscription | undefined;

  menuItems: MenuItem[] = [
    {
      id: 'customers',
      title: 'Customer Details',
      icon: 'people',
      active: true
    },
    {
      id: 'orders',
      title: 'Order Details',
      icon: 'shopping_cart',
      active: false
    },
    {
      id: 'tokens',
      title: 'Customer Token Details',
      icon: 'confirmation_number',
      active: false
    },
    {
      id: 'token-balance',
      title: 'Customer Token Balance',
      icon: 'account_balance_wallet',
      active: false
    }
  ];

  private idleTimeout: any;
  private readonly IDLE_TIME = 2 * 60 * 1000; // 2 minutes in milliseconds

  constructor(private router: Router, public loadingService: LoadingService) {
    // Setup idle timeout
    this.setupIdleTimeout();
  }

  private setupIdleTimeout(): void {
    // Events to track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Reset timeout on any user activity
    events.forEach(event => {
      document.addEventListener(event, () => this.resetIdleTimeout(), true);
    });
    
    // Start the initial timeout
    this.resetIdleTimeout();
  }

  private resetIdleTimeout(): void {
    // Clear existing timeout
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }
    
    // Set new timeout
    this.idleTimeout = setTimeout(() => {
      this.refreshApplication();
    }, this.IDLE_TIME);
  }

  private refreshApplication(): void {
    // Reload the page
    window.location.reload();
  }



  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed.toString());
  }

  ngOnInit() {
    // Restore sidebar collapsed state
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState) {
      this.sidebarCollapsed = savedSidebarState === 'true';
    }
    
    // Subscribe to router events to update active menu based on current route
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateActiveMenuFromRoute(event.url);
      });
    
    // Set initial active menu based on current route
    this.updateActiveMenuFromRoute(this.router.url);
  }
  
  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
  
  private updateActiveMenuFromRoute(url: string): void {
    // Extract the route segment after /nav/
    const routeSegment = url.split('/nav/')[1]?.split('?')[0] || 'customers';
    
    // Update menu items active state based on current route
    this.menuItems.forEach(item => {
      item.active = item.id === routeSegment;
    });
  }

  selectMenuItem(menuId: string): void {
    // Navigate to the route - the router subscription will update menu active state
    this.router.navigate(['/nav', menuId]);
  }

  get activeMenuTitle(): string {
    const activeItem = this.menuItems.find(item => item.active);
    return activeItem?.title || 'Dashboard';
  }

  logout(): void {
    localStorage.removeItem('userDetails');
    this.router.navigate(['/login']);
  }

  onImageError(event: any): void {
    // Hide the image if it fails to load and log the error
    console.warn('Logo image failed to load:', event.target.src);
    event.target.style.display = 'none';
  }
  
}
