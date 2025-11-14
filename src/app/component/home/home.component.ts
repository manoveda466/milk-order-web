import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UserDialogComponent } from '../user-dialog/user-dialog.component';
import { TokenDialogComponent } from '../token-dialog/token-dialog.component';
import { MilkOrderService } from '../../services/milk-order.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
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

  // Token history filters
  tokenHistoryFilters = {
    customerName: ''
  };

  // Filtered data
  filteredOrderDetails: any[] = [];
  filteredTokenBalance: any[] = [];
  filteredTokenHistory: any[] = [];
  uniqueAreas: string[] = [];
  uniqueStatuses: string[] = [];
  uniqueTokenTypes: string[] = [];
  uniqueCustomerNames: string[] = [];

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
    this.tokenDataSource.data = this.filteredTokenHistory;
  }

  ngAfterViewInit() {
    // Set up sorting after view init
    if (this.sort) {
      this.userDataSource.sort = this.sort;
      this.orderDataSource.sort = this.sort;
      this.tokenDataSource.sort = this.sort;
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
        this.userTokenDetails = response.result.data;
        this.filteredTokenHistory = [...response.result.data]; // Update filtered data
        this.tokenDataSource.data = this.filteredTokenHistory;
        this.initializeFilters(); // Reinitialize filters with new data
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

  // Token history filtering methods
  filterTokenHistory(): void {
    let filtered = [...this.userTokenDetails];

    // Filter by customer name
    if (this.tokenHistoryFilters.customerName) {
      filtered = filtered.filter(token => token.userName === this.tokenHistoryFilters.customerName);
    }

    this.filteredTokenHistory = filtered;
    this.tokenDataSource.data = this.filteredTokenHistory;
  }

  clearTokenHistoryFilters(): void {
    this.tokenHistoryFilters = {
      customerName: ''
    };
    this.filteredTokenHistory = [...this.userTokenDetails];
    this.tokenDataSource.data = this.filteredTokenHistory;
  }

  private initializeFilters(): void {
    // Initialize filtered data
    this.filteredOrderDetails = [...this.orderDetails];
    this.filteredTokenBalance = [...this.customerTokenBalance];
    this.filteredTokenHistory = [...this.userTokenDetails];
    
    // Extract unique areas for dropdown
    this.uniqueAreas = [...new Set(this.orderDetails.map(order => order.areaName))].filter(area => area);
    
    // Extract unique statuses for dropdown
    this.uniqueStatuses = [...new Set(this.orderDetails.map(order => order.status))].filter(status => status);
    
    // Extract unique token types for dropdown
    this.uniqueTokenTypes = [...new Set(this.orderDetails.map(order => order.tokenType))].filter(tokenType => tokenType);
    
    // Extract unique customer names for token history dropdown
    this.uniqueCustomerNames = [...new Set(this.userTokenDetails.map(token => token.userName))].filter(name => name);
    
  }

  // Filter method for search
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.getCurrentDataSource().filter = filterValue.trim().toLowerCase();
  }

  isOrdersFiltered(): boolean {
    return !!(this.orderFilters.deliveryDate || 
              this.orderFilters.area || 
              this.orderFilters.status || 
              this.orderFilters.tokenType);
  }

  exportOrdersPDF(): void {
    try {
      // Show loading state
      this.isLoading = true;
      
      // Create a new jsPDF instance
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape for more columns
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Always use the currently filtered/displayed orders
      const filteredOrders = this.filteredOrderDetails;
      const isFiltered = this.isOrdersFiltered();
      let reportTitle = isFiltered ? 'Filtered Orders Report' : 'All Orders Report';
      
      // Add filter details to title if filters are applied
      if (isFiltered) {
        const filterDetails = [];
        if (this.orderFilters.deliveryDate) {
          filterDetails.push(`Date: ${this.orderFilters.deliveryDate.toLocaleDateString()}`);
        }
        if (this.orderFilters.area) {
          filterDetails.push(`Area: ${this.orderFilters.area}`);
        }
        if (this.orderFilters.status) {
          filterDetails.push(`Status: ${this.orderFilters.status}`);
        }
        if (this.orderFilters.tokenType) {
          filterDetails.push(`Token: ${this.orderFilters.tokenType}`);
        }
        if (filterDetails.length > 0) {
          reportTitle += ` (${filterDetails.join(', ')})`;
        }
      }
      
      // Check if there are any orders to export
      if (filteredOrders.length === 0) {
        const filterText = isFiltered ? 'filtered orders' : 'orders';
        this.snackBar.open(`No ${filterText} found to export!`, 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['warning-snackbar']
        });
        this.isLoading = false;
        return;
      }
      
      // Set up the document title and header
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(44, 62, 80); // Dark blue-gray
      pdf.text(reportTitle, pageWidth / 2, 25, { align: 'center' });
      
      // Add a line under the title
      pdf.setDrawColor(52, 152, 219); // Blue
      pdf.setLineWidth(0.5);
      pdf.line(20, 30, pageWidth - 20, 30);
      
      // Add date and summary info
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      pdf.text(`Generated on: ${currentDate}`, 20, 40);
      
      // Calculate status counts
      const confirmedOrders = filteredOrders.filter(o => o.status === 'Confirmed').length;
      const deliveredOrders = filteredOrders.filter(o => o.status === 'Delivered').length;
      const cancelledOrders = filteredOrders.filter(o => o.status === 'Cancelled').length;
      
      pdf.text(`Confirmed: ${confirmedOrders} | Delivered: ${deliveredOrders} | Cancelled: ${cancelledOrders}`, pageWidth - 20, 40, { align: 'right' });
      
      // Table setup - landscape layout with more columns
      const headers = ['Order ID', 'Customer Name', 'Delivery Date', 'Area', 'Token Qty', 'Token Type', 'Status'];
      const columnWidths = [25, 50, 35, 35, 25, 35, 25];
      const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
      const startX = (pageWidth - tableWidth) / 2;
      let startY = 55;
      
      // Draw table headers
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setFillColor(52, 152, 219); // Blue header
      pdf.setTextColor(255, 255, 255); // White text
      pdf.rect(startX, startY - 6, tableWidth, 10, 'F');
      
      // Draw header borders
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.2);
      let currentX = startX;
      headers.forEach((header, index) => {
        if (index > 0) {
          pdf.line(currentX, startY - 6, currentX, startY + 4);
        }
        pdf.text(header, currentX + 2, startY);
        currentX += columnWidths[index];
      });
      
      // Draw table data
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60); // Dark gray text
      let currentY = startY + 12;
      const rowHeight = 10;
      
      filteredOrders.forEach((order, index) => {
        // Check if we need a new page
        if (currentY > pageHeight - 40) {
          pdf.addPage();
          currentY = 30;
          
          // Redraw headers on new page
          pdf.setFont('helvetica', 'bold');
          pdf.setFillColor(52, 152, 219);
          pdf.setTextColor(255, 255, 255);
          pdf.rect(startX, currentY - 6, tableWidth, 10, 'F');
          
          let headerX = startX;
          headers.forEach((header, headerIndex) => {
            if (headerIndex > 0) {
              pdf.line(headerX, currentY - 6, headerX, currentY + 4);
            }
            pdf.text(header, headerX + 2, currentY);
            headerX += columnWidths[headerIndex];
          });
          
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(60, 60, 60);
          currentY += 12;
        }
        
        // Draw row background (alternating colors)
        if (index % 2 === 0) {
          pdf.setFillColor(248, 249, 250);
          pdf.rect(startX, currentY - 6, tableWidth, rowHeight, 'F');
        }
        
        // Draw row borders
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.1);
        pdf.rect(startX, currentY - 6, tableWidth, rowHeight, 'S');
        
        // Order data
        const orderId = `#${order.orderId}`;
        const customerName = order.userName || 'N/A';
        const deliveryDate = order.orderDate ? this.formatDateToDDMMMYYYY(new Date(order.orderDate)) : 'N/A';
        const area = order.areaName || 'N/A';
        const tokenQty = order.tokenQty?.toString() || '0';
        const tokenType = order.tokenType || 'N/A';
        const status = order.status || 'Unknown';
        
        currentX = startX;
        
        // Helper function to wrap text
        const wrapText = (text: string, maxWidth: number): string => {
          if (pdf.getTextWidth(text) <= maxWidth - 4) {
            return text;
          }
          let wrapped = text;
          while (pdf.getTextWidth(wrapped + '...') > maxWidth - 4 && wrapped.length > 0) {
            wrapped = wrapped.slice(0, -1);
          }
          return wrapped + (wrapped.length < text.length ? '...' : '');
        };
        
        // Draw vertical separators and text
        const orderData = [orderId, customerName, deliveryDate, area, tokenQty, tokenType, status];
        orderData.forEach((cellData, colIndex) => {
          if (colIndex > 0) {
            pdf.setDrawColor(220, 220, 220);
            pdf.line(currentX, currentY - 6, currentX, currentY + 4);
          }
          
          // Color code status column
          if (colIndex === 6) { // Status column
            switch (status) {
              case 'Confirmed':
                pdf.setTextColor(25, 118, 210); // Blue
                break;
              case 'Delivered':
                pdf.setTextColor(34, 139, 34); // Green
                break;
              case 'Cancelled':
                pdf.setTextColor(220, 20, 60); // Red
                break;
              default:
                pdf.setTextColor(100, 100, 100); // Gray
            }
          } else {
            pdf.setTextColor(60, 60, 60);
          }
          
          const wrappedText = wrapText(cellData, columnWidths[colIndex]);
          pdf.text(wrappedText, currentX + 2, currentY);
          currentX += columnWidths[colIndex];
        });
        
        currentY += rowHeight;
      });
      
      // Add summary footer
      const summaryY = currentY + 10;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(52, 152, 219);
      pdf.text('Summary:', startX, summaryY);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Total Orders: ${filteredOrders.length}`, startX, summaryY + 8);
      pdf.text(`Confirmed: ${confirmedOrders}`, startX + 60, summaryY + 8);
      pdf.text(`Delivered: ${deliveredOrders}`, startX + 120, summaryY + 8);
      pdf.text(`Cancelled: ${cancelledOrders}`, startX + 180, summaryY + 8);
      
      // Calculate total token quantities by type
      const tokenSummary = filteredOrders.reduce((acc: any, order: any) => {
        const tokenType = order.tokenType || 'Unknown';
        const qty = parseInt(order.tokenQty) || 0;
        acc[tokenType] = (acc[tokenType] || 0) + qty;
        return acc;
      }, {});
      
      if (Object.keys(tokenSummary).length > 0) {
        pdf.text('Token Summary:', startX, summaryY + 16);
        let tokenX = startX;
        Object.entries(tokenSummary).forEach(([type, qty]) => {
          pdf.text(`${type}: ${qty}`, tokenX, summaryY + 24);
          tokenX += 60;
        });
      }
      
      // Add page numbers and footer to all pages
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(120, 120, 120);
        
        // Footer line
        pdf.setDrawColor(220, 220, 220);
        pdf.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
        
        // Page number and company info
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
        pdf.text('Milk Order Management System', 20, pageHeight - 10);
      }
      
      // Save the PDF
      const filterSuffix = isFiltered ? 'filtered' : 'all';
      const fileName = `orders_${filterSuffix}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      // Show success message
      const filterText = isFiltered ? 'Filtered' : 'All';
      this.snackBar.open(`${filterText} orders PDF exported successfully! (${filteredOrders.length} orders)`, 'Close', {
        duration: 4000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });
      
    } catch (error) {
      console.error('Error exporting orders PDF:', error);
      this.snackBar.open('Error exporting orders PDF. Please try again.', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isLoading = false;
    }
  }

  exportCustomersPDF(filter: 'all' | 'active' | 'inactive' = 'all'): void {
    try {
      // Show loading state
      this.isLoading = true;
      
      // Create a new jsPDF instance
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Filter data based on the selected filter
      let filteredCustomers = this.userDetails;
      let reportTitle = 'Customer Details Report';
      
      switch (filter) {
        case 'active':
          filteredCustomers = this.userDetails.filter(c => c.isActive);
          reportTitle = 'Active Customers Report';
          break;
        case 'inactive':
          filteredCustomers = this.userDetails.filter(c => !c.isActive);
          reportTitle = 'Inactive Customers Report';
          break;
        default:
          filteredCustomers = this.userDetails;
          reportTitle = 'All Customers Report';
      }
      
      // Check if there are any customers to export
      if (filteredCustomers.length === 0) {
        const filterText = filter === 'all' ? 'customers' : filter === 'active' ? 'active customers' : 'inactive customers';
        this.snackBar.open(`No ${filterText} found to export!`, 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['warning-snackbar']
        });
        this.isLoading = false;
        return;
      }
      
      // Set up the document title and header
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(44, 62, 80); // Dark blue-gray
      pdf.text(reportTitle, pageWidth / 2, 25, { align: 'center' });
      
      // Add a line under the title
      pdf.setDrawColor(52, 152, 219); // Blue
      pdf.setLineWidth(0.5);
      pdf.line(20, 30, pageWidth - 20, 30);
      
      // Add date and summary info
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      pdf.text(`Generated on: ${currentDate}`, 20, 40);
      
      const activeCustomers = filteredCustomers.filter(c => c.isActive).length;
      const inactiveCustomers = filteredCustomers.length - activeCustomers;
      pdf.text(`Active Customers: ${activeCustomers} | Inactive: ${inactiveCustomers}`, pageWidth - 20, 40, { align: 'right' });
      
      // Table setup
      const headers = ['Customer Name', 'Mobile No', 'Area', 'Address', 'Status'];
      const columnWidths = [45, 30, 25, 65, 25];
      const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
      const startX = (pageWidth - tableWidth) / 2;
      let startY = 55;
      
      // Draw table headers
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setFillColor(52, 152, 219); // Blue header
      pdf.setTextColor(255, 255, 255); // White text
      pdf.rect(startX, startY - 6, tableWidth, 10, 'F');
      
      // Draw header borders
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.2);
      let currentX = startX;
      headers.forEach((header, index) => {
        if (index > 0) {
          pdf.line(currentX, startY - 6, currentX, startY + 4);
        }
        pdf.text(header, currentX + 2, startY);
        currentX += columnWidths[index];
      });
      
      // Draw table data
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60); // Dark gray text
      let currentY = startY + 12;
      const rowHeight = 10;
      
      filteredCustomers.forEach((customer, index) => {
        // Check if we need a new page
        if (currentY > pageHeight - 40) {
          pdf.addPage();
          currentY = 30;
          
          // Redraw headers on new page
          pdf.setFont('helvetica', 'bold');
          pdf.setFillColor(52, 152, 219);
          pdf.setTextColor(255, 255, 255);
          pdf.rect(startX, currentY - 6, tableWidth, 10, 'F');
          
          let headerX = startX;
          headers.forEach((header, headerIndex) => {
            if (headerIndex > 0) {
              pdf.line(headerX, currentY - 6, headerX, currentY + 4);
            }
            pdf.text(header, headerX + 2, currentY);
            headerX += columnWidths[headerIndex];
          });
          
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(60, 60, 60);
          currentY += 12;
        }
        
        // Draw row background (alternating colors)
        if (index % 2 === 0) {
          pdf.setFillColor(248, 249, 250);
          pdf.rect(startX, currentY - 6, tableWidth, rowHeight, 'F');
        }
        
        // Draw row borders
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.1);
        pdf.rect(startX, currentY - 6, tableWidth, rowHeight, 'S');
        
        // Customer data
        const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
        const mobile = customer.mobile || 'N/A';
        const area = customer.areaName || 'N/A';
        const address = customer.address || 'N/A';
        const status = customer.isActive ? 'Active' : 'Inactive';
        
        currentX = startX;
        
        // Helper function to wrap text
        const wrapText = (text: string, maxWidth: number): string => {
          if (pdf.getTextWidth(text) <= maxWidth - 4) {
            return text;
          }
          let wrapped = text;
          while (pdf.getTextWidth(wrapped + '...') > maxWidth - 4 && wrapped.length > 0) {
            wrapped = wrapped.slice(0, -1);
          }
          return wrapped + (wrapped.length < text.length ? '...' : '');
        };
        
        // Draw vertical separators and text
        headers.forEach((header, colIndex) => {
          if (colIndex > 0) {
            pdf.setDrawColor(220, 220, 220);
            pdf.line(currentX, currentY - 6, currentX, currentY + 4);
          }
          
          let cellText = '';
          switch (colIndex) {
            case 0: cellText = customerName; break;
            case 1: cellText = mobile; break;
            case 2: cellText = area; break;
            case 3: cellText = address; break;
            case 4: cellText = status; break;
          }
          
          // Color code status column
          if (colIndex === 4) {
            if (status === 'Active') {
              pdf.setTextColor(34, 139, 34); // Forest green
            } else {
              pdf.setTextColor(220, 20, 60); // Crimson red
            }
          } else {
            pdf.setTextColor(60, 60, 60);
          }
          
          const wrappedText = wrapText(cellText, columnWidths[colIndex]);
          pdf.text(wrappedText, currentX + 2, currentY);
          currentX += columnWidths[colIndex];
        });
        
        currentY += rowHeight;
      });
      
      // Add summary footer
      const summaryY = currentY + 10;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(52, 152, 219);
      pdf.text('Summary:', startX, summaryY);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Total Customers: ${filteredCustomers.length}`, startX, summaryY + 8);
      pdf.text(`Active: ${activeCustomers}`, startX + 60, summaryY + 8);
      pdf.text(`Inactive: ${inactiveCustomers}`, startX + 100, summaryY + 8);
      
      // Add page numbers and footer to all pages
      const totalPages = pdf.internal.pages.length - 1; // Subtract 1 because jsPDF includes a blank page
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(120, 120, 120);
        
        // Footer line
        pdf.setDrawColor(220, 220, 220);
        pdf.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
        
        // Page number and company info
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
        pdf.text('Milk Order Management System', 20, pageHeight - 10);
      }
      
      // Save the PDF
      const filterSuffix = filter === 'all' ? 'all' : filter;
      const fileName = `customers_${filterSuffix}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      // Show success message
      const filterText = filter === 'all' ? 'All' : filter === 'active' ? 'Active' : 'Inactive';
      this.snackBar.open(`${filterText} customers PDF exported successfully! (${filteredCustomers.length} customers)`, 'Close', {
        duration: 4000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      this.snackBar.open('Error exporting PDF. Please try again.', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isLoading = false;
    }
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

  private formatDateToDDMMMYYYY(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
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
