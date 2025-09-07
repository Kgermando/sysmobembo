import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class CredentialInterceptor implements HttpInterceptor { 
  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!navigator.onLine) {
      // If offline, do not intercept the request
      return next.handle(request);
    }

    const req = request.clone({
      withCredentials: true
    });
    return next.handle(req);
  }
}