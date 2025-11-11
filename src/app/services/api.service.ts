import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient) {
    this.baseUrl = environment.apiUrl;
  }

  // Generic GET method
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<any>(`${this.baseUrl}/${endpoint}`)
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  // Generic POST method
  post<T>(endpoint: string, data?: any): Observable<T> {
    return this.http.post<any>(`${this.baseUrl}/${endpoint}`, data)
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  // Generic PUT method
  put<T>(endpoint: string, data?: any): Observable<T> {
    return this.http.put<any>(`${this.baseUrl}/${endpoint}`, data)
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  // Generic DELETE method
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<any>(`${this.baseUrl}/${endpoint}`)
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }
  
  private handleError = (error: any): Observable<never> => {
    return throwError(() => error);
  };
  
}