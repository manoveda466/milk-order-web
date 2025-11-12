import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  private activeRequests = 0;

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.activeRequests++;

    // Clone the request and add common headers
    const apiReq = req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Api-Key': 'c123af47-dbd4-43aa-ae16-9bc82e710c4c'
      }
    });

    // // Add authorization header if token exists
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   const authReq = apiReq.clone({
    //     setHeaders: {
    //       'Authorization': `Bearer ${token}`
    //     }
    //   });
    //   return this.handleRequest(authReq, next);
    // }

    return this.handleRequest(apiReq, next);
  }

  private handleRequest(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle different types of errors
        let errorMessage = 'An error occurred';
        
        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Client Error: ${error.error.message}`;
        } else {
          // Server-side error
          switch (error.status) {
            case 400:
              errorMessage = 'Bad Request';
              break;
            case 401:
              errorMessage = 'Unauthorized';
              // Clear token and redirect to login if needed
              localStorage.removeItem('authToken');
              break;
            case 403:
              errorMessage = 'Forbidden';
              break;
            case 404:
              errorMessage = 'Not Found';
              break;
            case 500:
              errorMessage = 'Internal Server Error';
              break;
            default:
              errorMessage = `Server Error: ${error.status}`;
          }
        }

        console.error('HTTP Error:', error);
        return throwError(() => new Error(errorMessage));
      }),
      finalize(() => {
        this.activeRequests--;
      })
    );
  }

  public get isLoading(): boolean {
    return this.activeRequests > 0;
  }
}