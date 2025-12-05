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
import { MilkOrderService } from '../../services/milk-order.service';
import { LoadingService } from '../../services/loading.service';
import { DataRefreshService } from '../../services/data-refresh.service';

@Component({
  selector: 'app-token-balance',
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
    MatSelectModule
  ],
  templateUrl: './token-balance.component.html',
  styleUrl: './token-balance.component.css'
})
export class TokenBalanceComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;

  customerTokenBalance: any[] = [];
  filteredTokenBalance: any[] = [];
  tokenBalanceDataSource = new MatTableDataSource<any>();
  tokenBalanceDisplayedColumns: string[] = ['customerName', 'balanceTokenQty'];
  
  tokenBalanceViewMode: 'grid' | 'list' = 'grid';
  tokenBalanceFiltersExpanded: boolean = false;

  tokenBalanceFilters = {
    customerName: ''
  };

  constructor(
    private milkOrderService: MilkOrderService,
    public loadingService: LoadingService,
    private dataRefreshService: DataRefreshService
  ) {}

  ngOnInit() {
    this.getCumulativeTokens();
    
    // Subscribe to refresh events
    this.dataRefreshService.refreshTokenBalance$.subscribe(() => {
      this.getCumulativeTokens();
    });
  }

  ngAfterViewInit() {
    if (this.sort) {
      this.tokenBalanceDataSource.sort = this.sort;
    }
  }

  toggleTokenBalanceFilters(): void {
    this.tokenBalanceFiltersExpanded = !this.tokenBalanceFiltersExpanded;
  }

  toggleTokenBalanceView(): void {
    this.tokenBalanceViewMode = this.tokenBalanceViewMode === 'grid' ? 'list' : 'grid';
  }

  getCumulativeTokens(): void {
    this.milkOrderService.getCumulativeTokens().subscribe({
      next: (response: any) => {
        this.customerTokenBalance = response.result.data;
        this.filteredTokenBalance = [...response.result.data];
        this.tokenBalanceDataSource.data = this.filteredTokenBalance;
      },
      error: (error: any) => {
        console.error('Error fetching cumulative tokens:', error);
      }
    });
  }

  filterTokenBalance(): void {
    if (!this.tokenBalanceFilters.customerName) {
      this.filteredTokenBalance = [...this.customerTokenBalance];
    } else {
      this.filteredTokenBalance = this.customerTokenBalance.filter(customer =>
        customer.userName === this.tokenBalanceFilters.customerName
      );
    }
    this.tokenBalanceDataSource.data = this.filteredTokenBalance;
  }

  clearTokenBalanceFilters(): void {
    this.tokenBalanceFilters.customerName = '';
    this.filterTokenBalance();
    this.tokenBalanceFiltersExpanded = false;
  }

  isTokenBalanceFiltered(): boolean {
    return !!this.tokenBalanceFilters.customerName;
  }
}
