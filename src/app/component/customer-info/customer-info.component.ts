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
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserDialogComponent } from '../user-dialog/user-dialog.component';
import { MilkOrderService } from '../../services/milk-order.service';
import { LoadingService } from '../../services/loading.service';
import { DataRefreshService } from '../../services/data-refresh.service';
import jsPDF from 'jspdf';

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
    try {
      
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
      const columnWidths = [40, 28, 35, 60, 25]; // Increased Area column width from 25 to 35
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
      pdf.setFontSize(9); // Ensure font size is set for table content
      pdf.setTextColor(60, 60, 60); // Dark gray text
      let currentY = startY + 12;
      const rowHeight = 12; // Increased minimum row height for better visibility
      
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
        const area = customer.areaName || customer.area || 'N/A'; // Try both areaName and area properties
        const address = customer.address || 'N/A';
        const status = customer.isActive ? 'Active' : 'Inactive';
  
        
        currentX = startX;
        
        // Enhanced function to wrap text into multiple lines
        const wrapTextMultiLine = (text: string, maxWidth: number): string[] => {
          if (!text || text.trim() === '' || text === 'N/A') {
            return [text || 'N/A'];
          }
          
          const words = text.trim().split(' ');
          const lines: string[] = [];
          let currentLine = '';
          
          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = pdf.getTextWidth(testLine);
            
            if (testWidth <= maxWidth - 4) {
              currentLine = testLine;
            } else {
              if (currentLine) {
                lines.push(currentLine);
                currentLine = word;
              } else {
                // Word is too long, truncate it
                let truncated = word;
                while (pdf.getTextWidth(truncated + '...') > maxWidth - 4 && truncated.length > 0) {
                  truncated = truncated.slice(0, -1);
                }
                lines.push(truncated + (truncated.length < word.length ? '...' : ''));
              }
            }
          }
          
          if (currentLine) {
            lines.push(currentLine);
          }
          
          return lines.length > 0 ? lines : [''];
        };
        
        // Prepare wrapped text for all columns to calculate row height
        const wrappedTexts: string[][] = [];
        const cellTexts = [customerName, mobile, area, address, status];
        
        cellTexts.forEach((cellText, colIndex) => {
          wrappedTexts[colIndex] = wrapTextMultiLine(cellText, columnWidths[colIndex]);
        });
        
        // Calculate required row height based on max lines in any column
        const maxLines = Math.max(...wrappedTexts.map(lines => lines.length));
        const dynamicRowHeight = Math.max(rowHeight, maxLines * 5 + 4);
        
        // Check if we need a new page with dynamic row height
        if (currentY + dynamicRowHeight > pageHeight - 40) {
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
        
        // Draw row background with dynamic height
        if (index % 2 === 0) {
          pdf.setFillColor(248, 249, 250);
          pdf.rect(startX, currentY - 6, tableWidth, dynamicRowHeight, 'F');
        }
        
        // Draw row borders with dynamic height
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.1);
        pdf.rect(startX, currentY - 6, tableWidth, dynamicRowHeight, 'S');
        
        // Draw vertical separators and multi-line text
        currentX = startX;
        headers.forEach((header, colIndex) => {
          if (colIndex > 0) {
            pdf.setDrawColor(220, 220, 220);
            pdf.line(currentX, currentY - 6, currentX, currentY - 6 + dynamicRowHeight);
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
          
          // Draw each line of wrapped text
          const lines = wrappedTexts[colIndex];
          lines.forEach((line, lineIndex) => {
            const yPosition = currentY + (lineIndex * 5);
            // Ensure text is visible with proper padding
            if (line && line.trim().length > 0) {
              pdf.text(line.trim(), currentX + 3, yPosition);
            }
          });
          
          currentX += columnWidths[colIndex];
        });
        
        currentY += dynamicRowHeight;
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
      this.showSnackbar(`${filterText} customers PDF exported successfully! (${filteredCustomers.length} customers)`, 'Close', {
        duration: 4000,
        panelClass: ['success-snackbar']
      });
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      this.showSnackbar('Error exporting PDF. Please try again.', 'Close', {
        panelClass: ['error-snackbar']
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
