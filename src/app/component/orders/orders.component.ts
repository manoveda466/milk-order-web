import { Component, ViewChild, OnInit, AfterViewInit, Output, EventEmitter } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MilkOrderService } from '../../services/milk-order.service';
import { LoadingService } from '../../services/loading.service';
import { DataRefreshService } from '../../services/data-refresh.service';

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
  @Output() createManualOrderClicked = new EventEmitter<void>();
  @Output() exportOrdersPDFClicked = new EventEmitter<{orders: any[], filters: any}>();

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

  constructor(
    private snackBar: MatSnackBar,
    private milkOrderService: MilkOrderService,
    private dateAdapter: DateAdapter<Date>,
    public loadingService: LoadingService,
    private dataRefreshService: DataRefreshService
  ) {
    this.dateAdapter.setLocale('en-GB');
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
    this.exportOrdersPDFClicked.emit({
      orders: this.filteredOrderDetails,
      filters: { ...this.orderFilters }
    });
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
}
