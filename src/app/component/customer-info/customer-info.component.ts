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
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserDialogComponent } from '../user-dialog/user-dialog.component';
import { MilkOrderService } from '../../services/milk-order.service';
import { LoadingService } from '../../services/loading.service';
import { DataRefreshService } from '../../services/data-refresh.service';

@Component({
  selector: 'app-customer-info',
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
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './customer-info.component.html',
  styleUrl: './customer-info.component.css'
})
export class CustomerInfoComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  @Output() exportCustomersPDFClicked = new EventEmitter<'all' | 'active' | 'inactive'>();

  userDetails: any[] = [];
  originalUserDetails: any[] = [];
  userDataSource = new MatTableDataSource();
  userDisplayedColumns: string[] = ['name', 'mobileNo', 'area', 'address', 'pin', 'isActive', 'actions'];
  
  customerSearchText: string = '';
  customerFiltersExpanded: boolean = false;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private milkOrderService: MilkOrderService,
    public loadingService: LoadingService,
    private dataRefreshService: DataRefreshService
  ) {}

  ngOnInit() {
    this.getCustomerDetails();
    
    // Subscribe to refresh events
    this.dataRefreshService.refreshCustomers$.subscribe(() => {
      this.getCustomerDetails();
    });
  }

  ngAfterViewInit() {
    if (this.sort) {
      this.userDataSource.sort = this.sort;
    }
  }

  toggleCustomerFilters(): void {
    this.customerFiltersExpanded = !this.customerFiltersExpanded;
  }

  getCustomerDetails() {
    this.milkOrderService.getCustomerDetails().subscribe({
      next: (response) => {
        if (response && response.result.data.length > 0) {
          this.userDetails = response.result.data;
          this.originalUserDetails = [...response.result.data];
          this.userDataSource.data = response.result.data;
        }
      },
      error: (error) => {
        console.error('Error fetching customer details:', error);
      }
    });
  }

  updateCustomerStatus(data: any) {
    this.milkOrderService.updateCustomerStatus(data).subscribe({
      next: (response) => {
        if (response && response.result.data) {
          this.getCustomerDetails();
          this.showSnackbar('User status changed successfully!', 'Close', {
            panelClass: ['warning-snackbar']
          });
        }
      },
      error: (error) => {
        console.error('Error updating customer status:', error);
      }
    });
  }

  editUser(userId: number): void {
    const user = userId === 0 ? null : this.userDetails.find((u: any) => u.userId === userId);

    this.loadingService.setDialogOpen(true);
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false,
      data: { user: user }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.loadingService.setDialogOpen(false);
      if (result.success == true) {
        if (userId === 0) {
          this.getCustomerDetails();
          this.dataRefreshService.triggerAllRefresh(); // Refresh all components
          this.showSnackbar('User added successfully!', 'Close', {
            panelClass: ['success-snackbar']
          });
        } else {
          const index = this.userDetails.findIndex((u: any) => u.userId === userId);
          if (index !== -1) {
            this.userDetails[index] = result;
          }
          this.showSnackbar('User updated successfully!', 'Close', {
            panelClass: ['success-snackbar']
          });
        }
        this.getCustomerDetails();
        this.dataRefreshService.triggerAllRefresh(); // Refresh all components
      } else {
        this.showSnackbar('Mobile number already exists. Please try a different number.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  deactivateUser(userId: number): void {
    if (userId > 0) {
      this.updateCustomerStatus({
        userId: userId,
        isActive: false,
        updatedBy: JSON.parse(localStorage.getItem('userDetails')!).userId.toString()
      });
    }
  }

  activateUser(userId: number): void {
    if (userId > 0) {
      this.updateCustomerStatus({
        userId: userId,
        isActive: true,
        updatedBy: JSON.parse(localStorage.getItem('userDetails')!).userId.toString()
      });
    }
  }

  searchCustomers(): void {
    if (this.customerSearchText.trim() === '') {
      this.userDataSource.data = this.originalUserDetails;
    } else {
      const searchText = this.customerSearchText.toLowerCase().trim();
      this.userDataSource.data = this.originalUserDetails.filter((user: any) => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        return fullName.includes(searchText) ||
          user.mobile?.toLowerCase().includes(searchText) ||
          user.areaName?.toLowerCase().includes(searchText) ||
          user.address?.toLowerCase().includes(searchText);
      });
    }
  }

  clearCustomerSearch(): void {
    this.customerSearchText = '';
    this.userDataSource.data = this.originalUserDetails;
    this.customerFiltersExpanded = false;
  }

  exportCustomersPDF(filter: 'all' | 'active' | 'inactive' = 'all'): void {
    this.exportCustomersPDFClicked.emit(filter);
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
