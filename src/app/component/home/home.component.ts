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
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UserDialogComponent } from '../user-dialog/user-dialog.component';
import { TokenDialogComponent } from '../token-dialog/token-dialog.component';
import { MilkOrderService } from '../../services/milk-order.service';

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
  isLoading: boolean = false;
  userDetails: any[] = [];
  userTokenDetails: any[] = [];
  customerTokenBalance: any[] = [];
  orderDetails: any[] = [];
  // Data sources for Material tables
  userDataSource = new MatTableDataSource();
  orderDataSource = new MatTableDataSource();
  tokenDataSource = new MatTableDataSource();
  tokenBalanceDataSource = new MatTableDataSource();

  // Column definitions
  userDisplayedColumns: string[] = ['name', 'mobileNo', 'area', 'address', 'isActive', 'actions'];
  orderDisplayedColumns: string[] = ['select', 'id', 'userName', 'deliverDate', 'area', 'tokenQty', 'tokenType', 'status', 'actions'];
  tokenDisplayedColumns: string[] = ['name', 'tokenQty', 'issueDate', 'tokenType', 'actions'];
  tokenBalanceDisplayedColumns: string[] = ['customerName', 'balanceTokenQty'];

  // Order selection properties
  selectedOrders: Set<string> = new Set();
  bulkUpdateStatus: string = '';

  // Order filters
  orderFilters = {
    deliveryDate: null as Date | null,
    area: '',
    status: '',
    tokenType: ''
  };

  // Token balance filters
  tokenBalanceFilters = {
    customerName: ''
  };

  // Filtered data
  filteredOrderDetails: any[] = [];
  filteredTokenBalance: any[] = [];
  uniqueAreas: string[] = [];
  uniqueStatuses: string[] = [];
  uniqueTokenTypes: string[] = [];

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

  // Pagination properties
  currentPage = {
    userDetails: 1,
    orderDetails: 1,
    userTokenDetails: 1,
    customerTokenBalance: 1
  };
  
  itemsPerPage = 5;

  constructor(private router: Router, private dialog: MatDialog, private snackBar: MatSnackBar, private milkOrderService: MilkOrderService, private sanitizer: DomSanitizer) {}
 

  ngOnInit() {
    // Initialize data sources
    this.getCustomerDetails();
    this.getTokenHistory();
    this.getCumulativeTokens();
    this.getOrderDetails();
    
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

  getOrderDetails() {
    this.milkOrderService.getOrders().subscribe({
      next: (response) => {
        this.isLoading = false; 
        if(response && response.result.data.length > 0 ){
          this.orderDetails = response.result.data;
          this.filteredOrderDetails = [...response.result.data]; // Update filtered data
          this.orderDataSource.data = this.filteredOrderDetails;
          this.initializeFilters(); // Reinitialize filters with new data
        }
      }
      ,
      error: (error) => {
        this.isLoading = false;
        
      }
    });
  }

  getCustomerDetails() {
    this.milkOrderService.getCustomerDetails().subscribe({
      next: (response) => {
        this.isLoading = false; 
        if(response && response.result.data.length > 0 ){
          this.userDetails = response.result.data;
          this.userDataSource.data = response.result.data;
        }
      }
      ,
      error: (error) => {
        this.isLoading = false;
        
      }
    });
  }

  getCustomerDetailsById(userId: number) {
    this.milkOrderService.getCustomerById(userId).subscribe({
      next: (response) => {
        this.isLoading = false; 
        if(response && response.result.data.length > 0 ){
          this.userDataSource.data = response.result.data;
        }
      }
      ,
      error: (error) => {
        this.isLoading = false;
        
      }
    });
  }

  updateCustomerStatus(data:any) {
    this.milkOrderService.updateCustomerStatus(data).subscribe({
      next: (response) => {
        this.isLoading = false; 
        if(response && response.result.data ){
          this.getCustomerDetails();
      this.snackBar.open('User deactivated successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['warning-snackbar']
      });
        }
      }
      ,
      error: (error) => {
        this.isLoading = false;
        
      }
    });
  }

  editUser(userId: number): void {
    const user = userId === 0 ? null : this.userDetails.find((u: any) => u.userId === userId);
 
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false,
      data: { user: user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (userId === 0) {
          this.getCustomerDetails();
          this.snackBar.open('User added successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
        } else {
          
          const index = this.userDetails.findIndex((u: any) => u.userId === userId);
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
        this.getCustomerDetails();
      }
    });
  }

  deactivateUser(userId: number): void {
    if (userId > 0) {
      this.updateCustomerStatus({ userId: userId, isActive: false, updatedBy: JSON.parse(localStorage.getItem('userDetails')!).userId.toString() });
      
    }
  }

  activateUser(userId: number): void {
    if (userId > 0) {
      this.updateCustomerStatus({ userId: userId, isActive: true, updatedBy: JSON.parse(localStorage.getItem('userDetails')!).userId.toString() });
      
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

  

  deliverOrder(orderId: string): void {
    
    const order = this.orderDetails.find(o => o.orderId === orderId);
    if (order) {

      this.milkOrderService.updateOrderStatus({ orderId: orderId, status: 'Delivered', updatedBy: JSON.parse(localStorage.getItem('userDetails')!).userId.toString() }).subscribe({
        next: (response) => {
          if(response && response.result.data ){
              this.getOrderDetails();
          }
        }
      });
      
      this.snackBar.open('Order delivered successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });
    }
  }

  cancelOrder(orderId: string): void {
    const order = this.orderDetails.find(o => o.orderId === orderId);
    if (order) {

      this.milkOrderService.updateOrderStatus({ orderId: orderId, status: 'Cancelled', updatedBy: JSON.parse(localStorage.getItem('userDetails')!).userId.toString() }).subscribe({
        next: (response) => {
          if(response && response.result.data ){
              this.getOrderDetails();
          }
        }
      });
      
      this.snackBar.open('Order cancelled successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });
    }
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
      // Clear only the currently visible/filtered orders
      this.filteredOrderDetails.forEach(order => {
        this.selectedOrders.delete(order.orderId);
      });
    } else {
      // Select all currently visible/filtered orders
      this.filteredOrderDetails.forEach(order => {
        this.selectedOrders.add(order.orderId);
      });
    }
  }

  isAllOrdersSelected(): boolean {
    return this.filteredOrderDetails.length > 0 && 
           this.filteredOrderDetails.every(order => this.selectedOrders.has(order.orderId));
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

    // Convert selectedOrders Set to comma-separated string
    const selectedOrdersString = Array.from(this.selectedOrders).join(',');    

    this.milkOrderService.updateBuldkOrder(selectedOrdersString, this.bulkUpdateStatus).subscribe({
      next: (response) => {
        if(response && response.result.data ){
          this.getOrderDetails();
           // Refresh filtered data
          this.filterOrders();

          // Show success message
          this.snackBar.open(`Selected order(s) updated to ${this.bulkUpdateStatus}!`, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
        }
      }
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
      data: { token: null, users: this.userDetails }
    });

    dialogRef.afterClosed().subscribe(result => {
      
         this.getTokenHistory();
         this.getCumulativeTokens();
        
        this.snackBar.open('Token added successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
      
    });
  }

  getTokenHistory(): void {
    this.milkOrderService.getTokenHistory().subscribe({
      next: (response) => {
        this.tokenDataSource.data = response.result.data;
        this.userTokenDetails = response.result.data;
      },
      error: (error) => {
        console.error('Error fetching token types:', error);
      }
    });
  }

  getCumulativeTokens(): void {
    this.milkOrderService.getCumulativeTokens().subscribe({
      next: (response) => {
        this.tokenBalanceDataSource.data = response.result.data;
        this.customerTokenBalance = response.result.data;
      },
      error: (error) => {
        console.error('Error fetching token types:', error);
      }
    });
  }

  deleteToken(userTokenId: number): void {
    const userToken = this.userTokenDetails.find((u: any) => u.userTokenId === userTokenId);

    this.milkOrderService.deleteCustomerToken(userTokenId).subscribe({
      next: (response) => {

        if(response && response.result.data ){
          
           this.milkOrderService.updateCumulativeToken({userId: userToken.userId, tokenId: userToken.tokenId, tokenQty: userToken.qty, status: 'edit'}).subscribe({
            next: (res) => {
              if(res && res.result.data){
                this.getTokenHistory();
                this.getCumulativeTokens();
              } 
            }  
             });
      
          this.snackBar.open('Token deleted successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',  
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
        }
      },
      error: () => {
        
      }
    });
  }

  async selectMenuItem(menuId: string): Promise<void> {
    this.activeSection = menuId;
    
    // Update active state for menu items
    this.menuItems.forEach(item => {
      item.active = item.id === menuId;
    });
    if(menuId === 'userDetails'){
      await this.getCustomerDetails();
    }else if(menuId === 'orderDetails'){
      await this.getOrderDetails();
    }else if(menuId === 'userTokenDetails'){
      await this.getTokenHistory();
    }else if(menuId === 'customerTokenBalance'){
      await this.getCumulativeTokens();
    }    
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
      const selectedDate = this.formatDateToDDMMYYYY(this.orderFilters.deliveryDate);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        return this.formatDateToDDMMYYYY(orderDate) === selectedDate;
      });
    }

    // Filter by area
    if (this.orderFilters.area) {
      filtered = filtered.filter(order => order.areaName === this.orderFilters.area);
    }

    // Filter by status
    if (this.orderFilters.status) {
      filtered = filtered.filter(order => order.status === this.orderFilters.status);
    }

    // Filter by token type
    if (this.orderFilters.tokenType) {
      filtered = filtered.filter(order => order.tokenType === this.orderFilters.tokenType);
    }

    this.filteredOrderDetails = filtered;
    this.orderDataSource.data = this.filteredOrderDetails;
  }

  clearOrderFilters(): void {
    this.orderFilters = {
      deliveryDate: null,
      area: '',
      status: '',
      tokenType: ''
    };
    this.filteredOrderDetails = [...this.orderDetails];
    this.orderDataSource.data = this.filteredOrderDetails;
  }

  // Token balance filtering methods
  filterTokenBalance(): void {
    let filtered = [...this.customerTokenBalance];

    // Filter by customer name
    if (this.tokenBalanceFilters.customerName) {
      filtered = filtered.filter(customer => customer.userName === this.tokenBalanceFilters.customerName);
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
    this.uniqueAreas = [...new Set(this.orderDetails.map(order => order.areaName))].filter(area => area);
    
    // Extract unique statuses for dropdown
    this.uniqueStatuses = [...new Set(this.orderDetails.map(order => order.status))].filter(status => status);
    
    // Extract unique token types for dropdown
    this.uniqueTokenTypes = [...new Set(this.orderDetails.map(order => order.tokenType))].filter(tokenType => tokenType);
    
    
  }

  // Filter method for search
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.getCurrentDataSource().filter = filterValue.trim().toLowerCase();
  }

  logout(): void {
    localStorage.removeItem('userDetails');
    this.router.navigate(['/login']);
  }

  private formatDateToDDMMYYYY(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return `${day}-${month}-${year}`;
  }

  // Method to calculate total token balance for a customer
  getTotalTokenBalance(customer: any): number {
    if (!customer.tokenDetails || customer.tokenDetails.length === 0) {
      return 0;
    }
    return customer.tokenDetails.reduce((total: number, token: any) => total + (parseInt(token.tokenQty) || 0), 0);
  }

  // Method to get token breakdown text
  getTokenBreakdownText(customer: any): string {
    if (!customer.tokenDetails || customer.tokenDetails.length === 0) {
      return 'No tokens';
    }
    return customer.tokenDetails
      .map((token: any) => `${token.tokenType.toUpperCase()}: ${token.tokenQty}`)
      .join(', ');
  }

  // Method to get token breakdown HTML with styling
  getTokenBreakdownHTML(customer: any): SafeHtml {
    if (!customer.tokenDetails || customer.tokenDetails.length === 0) {
      return this.sanitizer.bypassSecurityTrustHtml('<span style="color: #999; font-style: italic;">No tokens</span>');
    }
    const htmlString = customer.tokenDetails
      .map((token: any) => `<span style="font-weight: bold; color: #333;">${token.tokenType.toUpperCase()}</span>: <span style="font-weight: 600; color: #1976d2;">${token.tokenQty}</span>`)
      .join(', ');
    return this.sanitizer.bypassSecurityTrustHtml(htmlString);
  }

  
}
