import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserDialogComponent } from '../user-dialog/user-dialog.component';
import { TokenDialogComponent } from '../token-dialog/token-dialog.component';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  active: boolean;
}

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule, 
    MatPaginatorModule, 
    MatSortModule, 
    MatButtonModule, 
    MatIconModule, 
    MatCardModule, 
    MatChipsModule, 
    MatMenuModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  activeSection: string = 'userDetails';

  constructor(private router: Router, private dialog: MatDialog, private snackBar: MatSnackBar) {}

  // Data sources for Material tables
  userDataSource = new MatTableDataSource();
  orderDataSource = new MatTableDataSource();
  tokenDataSource = new MatTableDataSource();
  tokenBalanceDataSource = new MatTableDataSource();

  // Column definitions
  userDisplayedColumns: string[] = ['name', 'mobileNo', 'area', 'address', 'isActive', 'actions'];
  orderDisplayedColumns: string[] = ['select', 'id', 'userName', 'deliverDate', 'area', 'tokenQty', 'status', 'actions'];
  tokenDisplayedColumns: string[] = ['name', 'tokenQty', 'issueDate', 'tokenType', 'actions'];
  tokenBalanceDisplayedColumns: string[] = ['customerName', 'balanceTokenQty'];

  // Order selection properties
  selectedOrders: Set<string> = new Set();
  bulkUpdateStatus: string = '';

  // Order filters
  orderFilters = {
    deliveryDate: null as Date | null,
    area: '',
    status: ''
  };

  // Token balance filters
  tokenBalanceFilters = {
    customerName: ''
  };

  // Filtered data
  filteredOrderDetails: any[] = [];
  filteredTokenBalance: any[] = [];
  uniqueAreas: string[] = [];
  uniqueCustomerNames: string[] = [];
  uniqueStatuses: string[] = [];

  menuItems: MenuItem[] = [
    {
      id: 'userDetails',
      title: 'Customer Details',
      icon: '👤',
      active: true
    },
    {
      id: 'orderDetails',
      title: 'Order Details',
      icon: '📋',
      active: false
    },
    {
      id: 'userTokenDetails',
      title: 'Customer Token History',
      icon: '🔑',
      active: false
    },
    {
      id: 'customerTokenBalance',
      title: 'Customer Token Balance',
      icon: '💰',
      active: false
    }
  ];

  // Sample data for demonstration
  userDetails = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      mobileNo: '+91 9876543210',
      area: 'Downtown',
      address: '123 Main Street, City Center',
      isActive: true
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      mobileNo: '+91 9876543211',
      area: 'Uptown',
      address: '456 Oak Avenue, North District',
      isActive: true
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      mobileNo: '+91 9876543212',
      area: 'Suburbs',
      address: '789 Pine Road, Residential Area',
      isActive: false
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      email: 'sarah.wilson@example.com',
      mobileNo: '+91 9876543213',
      area: 'Downtown',
      address: '321 Elm Street, Business District',
      isActive: true
    },
    {
      id: 5,
      name: 'David Brown',
      email: 'david.brown@example.com',
      mobileNo: '+91 9876543214',
      area: 'Eastside',
      address: '654 Maple Drive, Garden Colony',
      isActive: false
    }
  ];

  orderDetails = [
    {
      id: 'ORD001',
      userName: 'John Doe',
      deliverDate: '2024-11-06',
      area: 'Downtown',
      tokenQty: 10,
      status: 'Delivered'
    },
    {
      id: 'ORD002',
      userName: 'Jane Smith',
      deliverDate: '2024-11-07',
      area: 'Uptown',
      tokenQty: 5,
      status: 'Confirmed'
    },
    {
      id: 'ORD003',
      userName: 'Mike Johnson',
      deliverDate: '2024-11-05',
      area: 'Suburbs',
      tokenQty: 15,
      status: 'Delivered'
    },
    {
      id: 'ORD004',
      userName: 'Sarah Wilson',
      deliverDate: '2024-11-08',
      area: 'Downtown',
      tokenQty: 8,
      status: 'Cancelled'
    },
    {
      id: 'ORD005',
      userName: 'David Brown',
      deliverDate: '2024-11-09',
      area: 'Eastside',
      tokenQty: 12,
      status: 'Confirmed'
    }
  ];

  userTokenDetails = [
    {
      id: 1,
      name: 'John Doe',
      tokenQty: 10,
      issueDate: '2024-11-01',
      tokenType: 'Monthly Premium'
    },
    {
      id: 2,
      name: 'Jane Smith',
      tokenQty: 5,
      issueDate: '2024-10-15',
      tokenType: 'Weekly Standard'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      tokenQty: 15,
      issueDate: '2024-09-01',
      tokenType: 'Monthly Premium'
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      tokenQty: 8,
      issueDate: '2024-11-03',
      tokenType: 'Daily Basic'
    },
    {
      id: 5,
      name: 'David Brown',
      tokenQty: 12,
      issueDate: '2024-10-20',
      tokenType: 'Weekly Standard'
    }
  ];

  customerTokenBalance = [
    {
      id: 1,
      customerName: 'John Doe',
      balanceTokenQty: 25
    },
    {
      id: 2,
      customerName: 'Jane Smith',
      balanceTokenQty: 12
    },
    {
      id: 3,
      customerName: 'Mike Johnson',
      balanceTokenQty: 8
    },
    {
      id: 4,
      customerName: 'Sarah Wilson',
      balanceTokenQty: 15
    },
    {
      id: 5,
      customerName: 'David Brown',
      balanceTokenQty: 20
    }
  ];

  // Pagination properties
  currentPage = {
    userDetails: 1,
    orderDetails: 1,
    userTokenDetails: 1,
    customerTokenBalance: 1
  };
  
  itemsPerPage = 5;

  // Get paginated data
  getPaginatedData(section: string, data: any[]): any[] {
    const startIndex = (this.currentPage[section as keyof typeof this.currentPage] - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return data.slice(startIndex, endIndex);
  }

  // Get total pages
  getTotalPages(dataLength: number): number {
    return Math.ceil(dataLength / this.itemsPerPage);
  }

  // Navigation methods
  goToPage(section: string, page: number): void {
    this.currentPage[section as keyof typeof this.currentPage] = page;
  }

  previousPage(section: string): void {
    const currentPageNum = this.currentPage[section as keyof typeof this.currentPage];
    if (currentPageNum > 1) {
      this.currentPage[section as keyof typeof this.currentPage] = currentPageNum - 1;
    }
  }

  nextPage(section: string, totalItems: number): void {
    const currentPageNum = this.currentPage[section as keyof typeof this.currentPage];
    const totalPages = this.getTotalPages(totalItems);
    if (currentPageNum < totalPages) {
      this.currentPage[section as keyof typeof this.currentPage] = currentPageNum + 1;
    }
  }

  // Action methods
  editUser(userId: number): void {
    const user = userId === 0 ? null : this.userDetails.find(u => u.id === userId);
    
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false,
      data: { user: user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (userId === 0) {
          // Add new user
          this.userDetails.push(result);
          this.snackBar.open('User added successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
        } else {
          // Update existing user
          const index = this.userDetails.findIndex(u => u.id === userId);
          if (index !== -1) {
            this.userDetails[index] = result;
          }
          this.snackBar.open('User updated successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
        }
        // Refresh the data source
        this.userDataSource.data = [...this.userDetails];
      }
    });
  }

  deactivateUser(userId: number): void {
    console.log('Deactivate user:', userId);
    // Implement deactivate functionality
    const user = this.userDetails.find(u => u.id === userId);
    if (user) {
      user.isActive = false;
      // Update the data source to reflect changes
      this.userDataSource.data = [...this.userDetails];
      
      this.snackBar.open('User deactivated successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['warning-snackbar']
      });
    }
  }

  activateUser(userId: number): void {
    console.log('Activate user:', userId);
    // Implement activate functionality
    const user = this.userDetails.find(u => u.id === userId);
    if (user) {
      user.isActive = true;
      // Update the data source to reflect changes
      this.userDataSource.data = [...this.userDetails];
      
      this.snackBar.open('User activated successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });
    }
  }

  deliverOrder(orderId: string): void {
    console.log('Deliver order:', orderId);
    // Implement deliver order functionality
    const order = this.orderDetails.find(o => o.id === orderId);
    if (order) {
      order.status = 'Delivered';
      // Update the data source to reflect changes
      this.orderDataSource.data = [...this.orderDetails];
      
      this.snackBar.open('Order delivered successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });
    }
  }

  cancelOrder(orderId: string): void {
    console.log('Cancel order:', orderId);
    // Implement cancel order functionality
    const order = this.orderDetails.find(o => o.id === orderId);
    if (order) {
      order.status = 'Cancelled';
      // Update the data source to reflect changes
      this.orderDataSource.data = [...this.orderDetails];
      
      this.snackBar.open('Order cancelled successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['warning-snackbar']
      });
    }
  }

  downloadOrder(orderId: string): void {
    console.log('Download order:', orderId);
    // Implement download order functionality
  }

  // Order selection methods
  toggleOrderSelection(orderId: string): void {
    if (this.selectedOrders.has(orderId)) {
      this.selectedOrders.delete(orderId);
    } else {
      this.selectedOrders.add(orderId);
    }
  }

  toggleAllOrders(): void {
    const allSelected = this.isAllOrdersSelected();
    if (allSelected) {
      this.selectedOrders.clear();
    } else {
      this.filteredOrderDetails.forEach(order => {
        this.selectedOrders.add(order.id);
      });
    }
  }

  isAllOrdersSelected(): boolean {
    return this.filteredOrderDetails.length > 0 && 
           this.filteredOrderDetails.every(order => this.selectedOrders.has(order.id));
  }

  isOrderSelected(orderId: string): boolean {
    return this.selectedOrders.has(orderId);
  }

  getSelectedOrdersCount(): number {
    return this.selectedOrders.size;
  }

  bulkUpdateOrderStatus(): void {
    if (this.selectedOrders.size === 0 || !this.bulkUpdateStatus) {
      this.snackBar.open('Please select orders and status to update!', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['warning-snackbar']
      });
      return;
    }

    // Update selected orders
    this.orderDetails.forEach(order => {
      if (this.selectedOrders.has(order.id)) {
        order.status = this.bulkUpdateStatus;
      }
    });

    // Refresh filtered data
    this.filterOrders();

    // Show success message
    this.snackBar.open(`${this.selectedOrders.size} order(s) updated to ${this.bulkUpdateStatus}!`, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });

    // Clear selections
    this.selectedOrders.clear();
    this.bulkUpdateStatus = '';
  }

  addToken(): void {
    const dialogRef = this.dialog.open(TokenDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false,
      data: { token: null, users: this.userDetails.map(u => ({ id: u.id, name: u.name })) }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Add new token
        this.userTokenDetails.push(result);
        // Refresh the data source
        this.tokenDataSource.data = [...this.userTokenDetails];
        
        this.snackBar.open('Token added successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  deleteToken(tokenId: number): void {
    console.log('Delete token:', tokenId);
    // Implement delete token functionality
    const index = this.userTokenDetails.findIndex(t => t.id === tokenId);
    if (index !== -1) {
      this.userTokenDetails.splice(index, 1);
      // Update the data source to reflect changes
      this.tokenDataSource.data = [...this.userTokenDetails];
      
      this.snackBar.open('Token deleted successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['warning-snackbar']
      });
    }
  }

  selectMenuItem(menuId: string): void {
    this.activeSection = menuId;
    
    // Update active state for menu items
    this.menuItems.forEach(item => {
      item.active = item.id === menuId;
    });
  }

  get activeMenuTitle(): string {
    const activeItem = this.menuItems.find(item => item.active);
    return activeItem?.title || 'Dashboard';
  }

  // Order filtering methods
  filterOrders(): void {
    let filtered = [...this.orderDetails];

    // Filter by delivery date
    if (this.orderFilters.deliveryDate) {
      const selectedDate = this.orderFilters.deliveryDate.toISOString().split('T')[0];
      filtered = filtered.filter(order => order.deliverDate === selectedDate);
    }

    // Filter by area
    if (this.orderFilters.area) {
      filtered = filtered.filter(order => order.area === this.orderFilters.area);
    }

    // Filter by status
    if (this.orderFilters.status) {
      filtered = filtered.filter(order => order.status === this.orderFilters.status);
    }

    this.filteredOrderDetails = filtered;
    this.orderDataSource.data = this.filteredOrderDetails;
  }

  clearOrderFilters(): void {
    this.orderFilters = {
      deliveryDate: null,
      area: '',
      status: ''
    };
    this.filteredOrderDetails = [...this.orderDetails];
    this.orderDataSource.data = this.filteredOrderDetails;
  }

  // Token balance filtering methods
  filterTokenBalance(): void {
    let filtered = [...this.customerTokenBalance];

    // Filter by customer name
    if (this.tokenBalanceFilters.customerName) {
      filtered = filtered.filter(balance => balance.customerName === this.tokenBalanceFilters.customerName);
    }

    this.filteredTokenBalance = filtered;
    this.tokenBalanceDataSource.data = this.filteredTokenBalance;
  }

  clearTokenBalanceFilters(): void {
    this.tokenBalanceFilters = {
      customerName: ''
    };
    this.filteredTokenBalance = [...this.customerTokenBalance];
    this.tokenBalanceDataSource.data = this.filteredTokenBalance;
  }

  private initializeFilters(): void {
    // Initialize filtered data
    this.filteredOrderDetails = [...this.orderDetails];
    this.filteredTokenBalance = [...this.customerTokenBalance];
    
    // Extract unique areas for dropdown
    this.uniqueAreas = [...new Set(this.orderDetails.map(order => order.area))];
    
    // Extract unique statuses for dropdown
    this.uniqueStatuses = [...new Set(this.orderDetails.map(order => order.status))];
    
    // Extract unique customer names for dropdown
    this.uniqueCustomerNames = [...new Set(this.customerTokenBalance.map(balance => balance.customerName))];
  }

  ngOnInit() {
    // Initialize data sources
    this.userDataSource.data = this.userDetails;
    this.tokenDataSource.data = this.userTokenDetails;
    
    // Initialize filters and filtered data
    this.initializeFilters();
    this.orderDataSource.data = this.filteredOrderDetails;
    this.tokenBalanceDataSource.data = this.filteredTokenBalance;
  }

  ngAfterViewInit() {
    // Set up pagination and sorting after view init
    if (this.paginator && this.sort) {
      this.userDataSource.paginator = this.paginator;
      this.userDataSource.sort = this.sort;
      this.orderDataSource.paginator = this.paginator;
      this.orderDataSource.sort = this.sort;
      this.tokenDataSource.paginator = this.paginator;
      this.tokenDataSource.sort = this.sort;
      this.tokenBalanceDataSource.paginator = this.paginator;
      this.tokenBalanceDataSource.sort = this.sort;
    }
  }

  // Get current data source based on active section
  getCurrentDataSource(): MatTableDataSource<any> {
    switch (this.activeSection) {
      case 'userDetails':
        return this.userDataSource;
      case 'orderDetails':
        return this.orderDataSource;
      case 'userTokenDetails':
        return this.tokenDataSource;
      case 'customerTokenBalance':
        return this.tokenBalanceDataSource;
      default:
        return this.userDataSource;
    }
  }

  // Filter method for search
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.getCurrentDataSource().filter = filterValue.trim().toLowerCase();
  }

  logout(): void {
    // Here you would implement actual logout logic
    console.log('User logged out');
    // Navigate back to login
    this.router.navigate(['/login']);
  }
}
