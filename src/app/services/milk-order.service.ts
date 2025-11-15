import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface MilkOrder {
  id?: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  milkType: string;
  quantity: number;
  deliveryDate: Date;
  deliveryAddress: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MilkOrderFilter {
  status?: string;
  customerName?: string;
  dateFrom?: Date;
  dateTo?: Date;
  milkType?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MilkOrderService {

  constructor(private apiService: ApiService) { }

  checkValidUser(mobileNumber: string): Observable<any> {
    return this.apiService.get('MilkOrders/ActiveUserByMobile?mobile='+mobileNumber);
  }

   sendOTP(data: any): Observable<any> {
    return this.apiService.post('MilkOrders/InsertUserOtp', data);
  }

  getUserDetailsById(userId: number): Observable<any> {
    return this.apiService.get('MilkOrders/UserDetailsByUserId?userId='+userId);
  }

  verifyOTP(userId: number, otp: string): Observable<any> {
    return this.apiService.get('MilkOrders/CheckUserOtp?userId='+userId+'&otp='+otp);
  }

  getCustomerDetails(): Observable<any> {
    return this.apiService.get('MilkOrders/AllUserDetails');
  }

   createCustomer(data: any): Observable<any> {
    return this.apiService.post('MilkOrders/InsertUser', data);
  }

    getAreas(): Observable<any> {
    return this.apiService.get('MilkOrders/Areas');
  }

  getCustomerById(userId: number): Observable<any> {
    return this.apiService.get('MilkOrders/UserDetailsByUserId?userId='+userId);
  }

   updateCustomer(data: any): Observable<any> {
    return this.apiService.put('MilkOrders/UpdateUser', data);
  }

  updateCustomerStatus(data: any): Observable<any> {
    return this.apiService.put('MilkOrders/UpdateUserStatus', data);
  }

  getTokens(): Observable<any> {
    return this.apiService.get('MilkOrders/Tokens');
  }

  createCustomerToken(data: any): Observable<any> {
    return this.apiService.post('MilkOrders/InsertUserToken', data);
  }

   deleteCustomerToken(userTokenId: number): Observable<any> {
    return this.apiService.delete('MilkOrders/DeleteUserToken?userTokenId=' + userTokenId);
  }

   getTokenHistory(): Observable<any> {
    return this.apiService.get('MilkOrders/UserTokenHistory');
  }

  getCumulativeTokens(): Observable<any> {
    return this.apiService.get('MilkOrders/CumulativeUserTokens');
  }

  updateCumulativeToken(data: any): Observable<any> {
    return this.apiService.put('MilkOrders/UpdateCumulativeUserToken', data);
  }

  getOrders(): Observable<any> {
    return this.apiService.get('MilkOrders/Orders');
  }

  updateOrderStatus(data: any): Observable<any> {
    return this.apiService.put('MilkOrders/UpdateOrderStatus', data);
  }

  updateBuldkOrder(orderIds: string, status: string): Observable<any> {
    return this.apiService.put('MilkOrders/UpdateBulkOrderStatus?orderIds='+orderIds+'&status='+status);
  }

  createManualOrder(data: any): Observable<any> {
    return this.apiService.post('MilkOrders/CreateOrder', data);
  }



}