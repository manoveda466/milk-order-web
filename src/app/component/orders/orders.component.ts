import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MilkOrderService } from '../../services/milk-order.service';
import { LoadingService } from '../../services/loading.service';
import { DataRefreshService } from '../../services/data-refresh.service';
import { ManualOrderDialogComponent } from '../manual-order-dialog/manual-order-dialog.component';
import jsPDF from 'jspdf';

const DD_MM_YYYY_FORMAT = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MM_YYYY_FORMAT }
  ]
})
export class OrdersComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;

  orderDetails: any[] = [];
  filteredOrderDetails: any[] = [];
  orderDataSource = new MatTableDataSource();
  orderDisplayedColumns: string[] = ['select', 'id', 'userName', 'deliverDate', 'area', 'tokenQty', 'tokenType', 'status', 'actions'];
  
  selectedOrders: Set<string> = new Set();
  bulkUpdateStatus: string = '';
  orderFiltersExpanded: boolean = false;

  orderFilters = {
    customerName: '',
    deliveryDate: null as Date | null,
    area: '',
    status: '',
    tokenType: ''
  };

  uniqueAreas: string[] = [];
  uniqueStatuses: string[] = [];
  uniqueTokenTypes: string[] = [];
  uniqueOrderCustomers: string[] = [];
  userDetails: any[] = []; // For manual order dialog

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private milkOrderService: MilkOrderService,
    private dateAdapter: DateAdapter<Date>,
    public loadingService: LoadingService,
    private dataRefreshService: DataRefreshService
  ) {
    this.dateAdapter.setLocale('en-GB');
    this.getUserDetails(); // Load customer details for manual order dialog
  }

  ngOnInit() {
    this.getOrderDetails();
    
    // Subscribe to refresh events
    this.dataRefreshService.refreshOrders$.subscribe(() => {
      this.getOrderDetails();
    });
  }

  ngAfterViewInit() {
    if (this.sort) {
      this.orderDataSource.sort = this.sort;
    }
  }

  toggleOrderFilters(): void {
    this.orderFiltersExpanded = !this.orderFiltersExpanded;
  }

  getOrderDetails() {
    this.milkOrderService.getOrders().subscribe({
      next: (response) => {
        if (response && response.result.data.length > 0) {
          this.orderDetails = response.result.data;
          this.filteredOrderDetails = [...response.result.data];
          this.orderDataSource.data = this.filteredOrderDetails;
          this.initializeFilters();
        }
      },
      error: (error) => {
        console.error('Error fetching orders:', error);
      }
    });
  }

  initializeFilters() {
    this.uniqueAreas = [...new Set(this.orderDetails.map(order => order.areaName))].filter(Boolean);
    this.uniqueStatuses = [...new Set(this.orderDetails.map(order => order.status))].filter(Boolean);
    this.uniqueTokenTypes = [...new Set(this.orderDetails.map(order => order.tokenType))].filter(Boolean);
    this.uniqueOrderCustomers = [...new Set(this.orderDetails.map(order => order.userName))].filter(Boolean);
  }

  filterOrders(): void {
    this.filteredOrderDetails = this.orderDetails.filter(order => {
      const matchesCustomer = !this.orderFilters.customerName || order.userName === this.orderFilters.customerName;
      const matchesArea = !this.orderFilters.area || order.areaName === this.orderFilters.area;
      const matchesStatus = !this.orderFilters.status || order.status === this.orderFilters.status;
      const matchesTokenType = !this.orderFilters.tokenType || order.tokenType === this.orderFilters.tokenType;
      
      let matchesDate = true;
      if (this.orderFilters.deliveryDate) {
        const orderDate = new Date(order.orderDate);
        const filterDate = new Date(this.orderFilters.deliveryDate);
        matchesDate = orderDate.toDateString() === filterDate.toDateString();
      }

      return matchesCustomer && matchesArea && matchesStatus && matchesTokenType && matchesDate;
    });

    this.orderDataSource.data = this.filteredOrderDetails;
  }

  clearOrderFilters(): void {
    this.orderFilters = {
      customerName: '',
      deliveryDate: null,
      area: '',
      status: '',
      tokenType: ''
    };
    this.filterOrders();
    this.orderFiltersExpanded = false;
  }

  isOrdersFiltered(): boolean {
    return !!(this.orderFilters.customerName || this.orderFilters.deliveryDate || 
              this.orderFilters.area || this.orderFilters.status || this.orderFilters.tokenType);
  }

  exportOrdersPDF(): void {
    // Export logic moved from home component - now handled locally
    try {
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const filteredOrders = this.filteredOrderDetails;
      const isFiltered = this.isOrdersFiltered();
      let reportTitle = isFiltered ? 'Filtered Orders Report' : 'All Orders Report';
      
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
      
      if (filteredOrders.length === 0) {
        const filterText = isFiltered ? 'filtered orders' : 'orders';
        this.snackBar.open(`No ${filterText} found to export!`, 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['warning-snackbar']
        });
        return;
      }
      
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(44, 62, 80);
      pdf.text(reportTitle, pageWidth / 2, 25, { align: 'center' });
      
      pdf.setDrawColor(52, 152, 219);
      pdf.setLineWidth(0.5);
      pdf.line(20, 30, pageWidth - 20, 30);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      pdf.text(`Generated on: ${currentDate}`, 20, 40);
      
      const confirmedOrders = filteredOrders.filter(o => o.status === 'Confirmed').length;
      const deliveredOrders = filteredOrders.filter(o => o.status === 'Delivered').length;
      const cancelledOrders = filteredOrders.filter(o => o.status === 'Cancelled').length;
      
      pdf.text(`Confirmed: ${confirmedOrders} | Delivered: ${deliveredOrders} | Cancelled: ${cancelledOrders}`, pageWidth - 20, 40, { align: 'right' });
      
      const headers = ['Order ID', 'Customer', 'Date', 'Area', 'Qty', 'Type', 'Status'];
      const columnWidths = [25, 50, 35, 35, 20, 35, 30];
      const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
      const startX = (pageWidth - tableWidth) / 2;
      let startY = 55;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setFillColor(52, 152, 219);
      pdf.setTextColor(255, 255, 255);
      pdf.rect(startX, startY - 6, tableWidth, 10, 'F');
      
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
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      let currentY = startY + 12;
      const rowHeight = 10;
      
      filteredOrders.forEach((order, index) => {
        if (currentY > pageHeight - 40) {
          pdf.addPage();
          currentY = 30;
        }
        
        if (index % 2 === 0) {
          pdf.setFillColor(248, 249, 250);
          pdf.rect(startX, currentY - 6, tableWidth, rowHeight, 'F');
        }
        
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.1);
        pdf.rect(startX, currentY - 6, tableWidth, rowHeight, 'S');
        
        const orderId = `#${order.orderId}`;
        const customerName = order.userName || 'N/A';
        const deliveryDate = order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A';
        const area = order.areaName || 'N/A';
        const tokenQty = order.tokenQty?.toString() || '0';
        const tokenType = order.tokenType || 'N/A';
        const status = order.status || 'Unknown';
        
        currentX = startX;
        
        const orderData = [orderId, customerName, deliveryDate, area, tokenQty, tokenType, status];
        orderData.forEach((cellData, colIndex) => {
          if (colIndex > 0) {
            pdf.setDrawColor(220, 220, 220);
            pdf.line(currentX, currentY - 6, currentX, currentY + 4);
          }
          
          if (colIndex === 6) {
            switch (status) {
              case 'Confirmed': pdf.setTextColor(25, 118, 210); break;
              case 'Delivered': pdf.setTextColor(34, 139, 34); break;
              case 'Cancelled': pdf.setTextColor(220, 20, 60); break;
              default: pdf.setTextColor(100, 100, 100);
            }
          } else {
            pdf.setTextColor(60, 60, 60);
          }
          
          pdf.text(cellData.substring(0, 20), currentX + 2, currentY);
          currentX += columnWidths[colIndex];
        });
        
        currentY += rowHeight;
      });
      
      const fileName = `orders_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      this.showSnackbar(`Orders PDF exported successfully! (${filteredOrders.length} orders)`, 'Close', {
        panelClass: ['success-snackbar']
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.showSnackbar('Error generating PDF', 'Close', {
        panelClass: ['error-snackbar']
      });
    }
  }

  deliverOrder(orderId: string): void {
    const order = this.orderDetails.find(o => o.orderId === orderId);
    if (order) {
      this.milkOrderService.updateOrderStatus({
        orderId: orderId,
        status: 'Delivered',
        updatedBy: JSON.parse(localStorage.getItem('userDetails')!).userId.toString()
      }).subscribe({
        next: (response) => {
          if (response && response.result.data) {
            this.getOrderDetails();
            this.showSnackbar('Order delivered successfully!', 'Close', {
              panelClass: ['success-snackbar']
            });
          }
        }
      });
    }
  }

  async cancelOrder(orderId: string) {
    const order = this.orderDetails.find(o => o.orderId === orderId);
    if (order) {
      await this.milkOrderService.updateOrderStatus({
        orderId: orderId,
        status: 'Cancelled',
        updatedBy: JSON.parse(localStorage.getItem('userDetails')!).userId.toString()
      }).subscribe({
        next: (response) => {
          if (response && response.result.data) {
            this.milkOrderService.updateCumulativeToken({
              userId: order.userId,
              tokenId: order.tokenId,
              tokenQty: order.tokenQty,
              status: 'add'
            }).subscribe({
              next: (res) => {
                if (res && res.result.data) {
                  this.getOrderDetails();
                  this.showSnackbar('Order cancelled successfully!', 'Close', {
                    panelClass: ['success-snackbar']
                  });
                }
              }
            });
          }
        }
      });
    }
  }

  toggleOrderSelection(orderId: string): void {
    const order = this.orderDetails.find(o => o.orderId === orderId);
    if (order && (order.status === 'Cancelled' || order.status === 'Delivered')) {
      return;
    }
    
    if (this.selectedOrders.has(orderId)) {
      this.selectedOrders.delete(orderId);
    } else {
      this.selectedOrders.add(orderId);
    }
    
    // Collapse filter when orders are selected, expand when none selected
    if (this.selectedOrders.size > 0) {
      this.orderFiltersExpanded = false;
    }
  }

  toggleAllOrders(): void {
    const allSelected = this.isAllOrdersSelected();
    if (allSelected) {
      this.filteredOrderDetails.forEach(order => {
        if (order.status !== 'Cancelled' && order.status !== 'Delivered') {
          this.selectedOrders.delete(order.orderId);
        }
      });
    } else {
      this.filteredOrderDetails.forEach(order => {
        if (order.status !== 'Cancelled' && order.status !== 'Delivered') {
          this.selectedOrders.add(order.orderId);
        }
      });
    }
    
    // Collapse filter when orders are selected, expand when none selected
    if (this.selectedOrders.size > 0) {
      this.orderFiltersExpanded = false;
    }
  }

  isAllOrdersSelected(): boolean {
    const selectableOrders = this.filteredOrderDetails.filter(order => 
      order.status !== 'Cancelled' && order.status !== 'Delivered'
    );
    return selectableOrders.length > 0 && 
           selectableOrders.every(order => this.selectedOrders.has(order.orderId));
  }

  isOrderSelected(orderId: string): boolean {
    return this.selectedOrders.has(orderId);
  }

  getSelectedOrdersCount(): number {
    return this.selectedOrders.size;
  }

  bulkUpdateOrderStatus(): void {
    if (this.selectedOrders.size === 0 || !this.bulkUpdateStatus) {
      this.showSnackbar('Please select orders and status to update!', 'Close', {
        panelClass: ['warning-snackbar']
      });
      return;
    }

    const selectedOrdersString = Array.from(this.selectedOrders).join(',');

    this.milkOrderService.updateBuldkOrder(selectedOrdersString, this.bulkUpdateStatus).subscribe({
      next: (response) => {
        if (response && response.result.data) {
          this.getOrderDetails();
          this.filterOrders();
          this.showSnackbar(`Selected order(s) updated successfully!`, 'Close', {
            panelClass: ['success-snackbar']
          });
        }
      }
    });

    this.selectedOrders.clear();
    this.bulkUpdateStatus = '';
    this.clearOrderFilters();
  }

  private showSnackbar(message: string, action: string = 'Close', config: any = {}): void {
    this.loadingService.setSnackbarOpen(true);
    const snackBarRef = this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      ...config
    });

    snackBarRef.afterDismissed().subscribe(() => {
      this.loadingService.setSnackbarOpen(false);
    });
  }

  getUserDetails(): void {
    this.milkOrderService.getCustomerDetails().subscribe({
      next: (response) => {
        if (response && response.result.data.length > 0) {
          this.userDetails = response.result.data;
        }
      },
      error: (error) => {
        console.error('Error fetching customer details:', error);
      }
    });
  }

  createManualOrder(): void {
    this.loadingService.setDialogOpen(true);
    const activeCustomers = this.userDetails.filter(user => user.isActive);
    const dialogRef = this.dialog.open(ManualOrderDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false,
      data: { users: activeCustomers }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.loadingService.setDialogOpen(false);
      if (result && result.success) {
        this.getOrderDetails();
        this.dataRefreshService.triggerAllRefresh();
        
        this.showSnackbar(result.message || 'Manual order created successfully!', 'Close', {
          panelClass: ['success-snackbar']
        });
      } else if (result && !result.success) {
        this.showSnackbar(result.message || 'Failed to create manual order', 'Close', {
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
