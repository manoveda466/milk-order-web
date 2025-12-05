import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataRefreshService {
  private refreshCustomersSubject = new Subject<void>();
  private refreshOrdersSubject = new Subject<void>();
  private refreshTokensSubject = new Subject<void>();
  private refreshTokenBalanceSubject = new Subject<void>();

  refreshCustomers$ = this.refreshCustomersSubject.asObservable();
  refreshOrders$ = this.refreshOrdersSubject.asObservable();
  refreshTokens$ = this.refreshTokensSubject.asObservable();
  refreshTokenBalance$ = this.refreshTokenBalanceSubject.asObservable();

  triggerCustomersRefresh() {
    this.refreshCustomersSubject.next();
  }

  triggerOrdersRefresh() {
    this.refreshOrdersSubject.next();
  }

  triggerTokensRefresh() {
    this.refreshTokensSubject.next();
  }

  triggerTokenBalanceRefresh() {
    this.refreshTokenBalanceSubject.next();
  }

  triggerAllRefresh() {
    this.refreshCustomersSubject.next();
    this.refreshOrdersSubject.next();
    this.refreshTokensSubject.next();
    this.refreshTokenBalanceSubject.next();
  }
}
