import { Component, ViewChild, OnInit, AfterViewInit, Output, EventEmitter, Input } from '@angular/core';
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
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MilkOrderService } from '../../services/milk-order.service';
import { LoadingService} from '../../services/loading.service';
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
  selector: 'app-tokens',
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
    MatMenuModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './tokens.component.html',
  styleUrl: './tokens.component.css',
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MM_YYYY_FORMAT }
  ]
})
export class TokensComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  @Output() addTokenClicked = new EventEmitter<void>();

  userTokenDetails: any[] = [];
  filteredTokenHistory: any[] = [];
  tokenDataSource = new MatTableDataSource();
  tokenDisplayedColumns: string[] = ['name', 'tokenQty', 'issueDate', 'tokenType', 'totalAmount', 'paymentMode', 'paymentDate', 'status', 'actions'];
  
  tokenHistoryFiltersExpanded: boolean = false;

  tokenHistoryFilters = {
    customerName: '',
    status: '',
    paymentMode: '',
    paymentDate: null as Date | null
  };

  uniqueCustomerNames: string[] = [];
  uniqueTokenStatuses: string[] = [];
  uniquePaymentModes: string[] = [];

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
    this.getTokenHistory();
    
    // Subscribe to refresh events
    this.dataRefreshService.refreshTokens$.subscribe(() => {
      this.getTokenHistory();
    });
  }

  ngAfterViewInit() {
    if (this.sort) {
      this.tokenDataSource.sort = this.sort;
    }
  }

  toggleTokenHistoryFilters(): void {
    this.tokenHistoryFiltersExpanded = !this.tokenHistoryFiltersExpanded;
  }

  getTokenHistory(): void {
    this.milkOrderService.getTokenHistory().subscribe({
      next: (response) => {
        this.userTokenDetails = response.result.data;
        this.filteredTokenHistory = [...response.result.data];
        this.tokenDataSource.data = this.filteredTokenHistory;
        this.initializeFilters();
      },
      error: (error) => {
        console.error('Error fetching token history:', error);
      }
    });
  }

  initializeFilters() {
    this.uniqueCustomerNames = [...new Set(this.userTokenDetails.map(token => token.userName))].filter(Boolean);
    this.uniqueTokenStatuses = [...new Set(this.userTokenDetails.map(token => token.status))].filter(Boolean);
    this.uniquePaymentModes = [...new Set(this.userTokenDetails.map(token => token.paymentMode))].filter(Boolean);
  }

  filterTokenHistory(): void {
    this.filteredTokenHistory = this.userTokenDetails.filter(token => {
      const matchesCustomer = !this.tokenHistoryFilters.customerName || token.userName === this.tokenHistoryFilters.customerName;
      const matchesStatus = !this.tokenHistoryFilters.status || token.status === this.tokenHistoryFilters.status;
      const matchesPaymentMode = !this.tokenHistoryFilters.paymentMode || token.paymentMode === this.tokenHistoryFilters.paymentMode;
      
      let matchesPaymentDate = true;
      if (this.tokenHistoryFilters.paymentDate) {
        const tokenDate = new Date(token.paymentDate);
        const filterDate = new Date(this.tokenHistoryFilters.paymentDate);
        matchesPaymentDate = tokenDate.toDateString() === filterDate.toDateString();
      }

      return matchesCustomer && matchesStatus && matchesPaymentMode && matchesPaymentDate;
    });

    this.tokenDataSource.data = this.filteredTokenHistory;
  }

  clearTokenHistoryFilters(): void {
    this.tokenHistoryFilters = {
      customerName: '',
      status: '',
      paymentMode: '',
      paymentDate: null
    };
    this.filterTokenHistory();
    this.tokenHistoryFiltersExpanded = false;
  }

  isTokenHistoryFiltered(): boolean {
    return !!(this.tokenHistoryFilters.customerName || this.tokenHistoryFilters.status || 
              this.tokenHistoryFilters.paymentMode || this.tokenHistoryFilters.paymentDate);
  }

  recordCashPayment(userTokenId: number): void {
    const userToken = this.userTokenDetails.find((u: any) => u.userTokenId === userTokenId);
    
    if (userToken) {
      const now = new Date();
      const istDate = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      const paymentDate = istDate.toISOString();

      const paymentData = {
        userTokenId: userTokenId,
        paymentMode: 'Cash',
        paymentDate: paymentDate,
        status: 'Completed'
      };

      this.milkOrderService.updateCustomerTokenStatus(paymentData).subscribe({
        next: (response: any) => {
          if (response && response.result.data) {
            this.milkOrderService.updateCumulativeToken({
              userId: userToken.userId,
              tokenId: userToken.tokenId,
              tokenQty: userToken.qty,
              status: 'add'
            }).subscribe({
              next: (res: any) => {
                if (res && res.result.data) {
                  this.getTokenHistory();
                  this.showSnackbar('Cash payment recorded successfully!', 'Close', {
                    panelClass: ['success-snackbar']
                  });
                }
              },
              error: (error: any) => {
                console.error('Error updating cumulative token:', error);
              }
            });
          }
        },
        error: (error: any) => {
          console.error('Error recording payment:', error);
          this.showSnackbar('Error recording payment', 'Close', {
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  deleteToken(userTokenId: number): void {
    if (confirm('Are you sure you want to delete this token?')) {
      const userToken = this.userTokenDetails.find((u: any) => u.userTokenId === userTokenId);

      this.milkOrderService.deleteCustomerToken(userTokenId).subscribe({
        next: (response: any) => {
          if (response && response.result.data) {
            this.getTokenHistory();
            this.showSnackbar('Token deleted successfully!', 'Close', {
              panelClass: ['success-snackbar']
            });
          }
        },
        error: (error: any) => {
          console.error('Error deleting token:', error);
          this.showSnackbar('Error deleting token', 'Close', {
            panelClass: ['error-snackbar']
          });
        }
      });
    }
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
