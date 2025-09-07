import { HttpClient, HttpEvent, HttpEventType, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, Subject, tap } from 'rxjs'; 
import { ApiResponse2 } from '../model/api-response.model'; 

@Injectable({
  providedIn: 'root'
})
export abstract class ApiService {
  abstract get endpoint(): string;

  constructor(protected http: HttpClient) { }

  private _refreshDataList$ = new Subject<void>();

  private _refreshData$ = new Subject<void>();

  get refreshDataList$() {
    return this._refreshDataList$;
  }

  get refreshData$() {
    return this._refreshData$;
  }

  getDataSynchronisation(
    entreprise_uuid: string, pos_uuid: string, sync_created: string): Observable<any> {
    let params = new HttpParams() 
    .set("sync_created", sync_created)
    return this.http.get<any>(`${this.endpoint}/${entreprise_uuid}/${pos_uuid}/all/synchronisation`, { params });
  }

    getDataSynchronisationWithOutSyncCreated(
    entreprise_uuid: string, pos_uuid: string): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/${entreprise_uuid}/${pos_uuid}/all/synchronisation-without-sync-created`);
  }

  getPaginatedEntrepriseRangeDate(
    entreprise_uuid: string, page: number, 
    pageSize: number, search: string,
    startDateStr: string, endDateStr: string): Observable<ApiResponse2> {
    let params = new HttpParams()
    .set("page", page.toString())
    .set("page_size", pageSize.toString())
    .set("search", search)
    .set("start_date", startDateStr)
    .set("end_date", endDateStr)
    return this.http.get<ApiResponse2>(`${this.endpoint}/${entreprise_uuid}/all/paginate`, { params });
  }

  getPaginatedEntrepriseByPosRangeDate(
    entreprise_uuid: string, pos_uuid: string, page: number, 
    pageSize: number, search: string,
    startDateStr: string, endDateStr: string): Observable<ApiResponse2> {
    let params = new HttpParams()
    .set("page", page.toString())
    .set("page_size", pageSize.toString())
    .set("search", search)
    .set("start_date", startDateStr)
    .set("end_date", endDateStr)
    return this.http.get<ApiResponse2>(`${this.endpoint}/${entreprise_uuid}/${pos_uuid}/all/paginate`, { params });
  }


  getPaginatedEntreprise(entreprise_uuid: string, page: number, pageSize: number, search: string): Observable<ApiResponse2> {
    let params = new HttpParams()
    .set("page", page.toString())
    .set("page_size", pageSize.toString())
    .set("search", search)
    return this.http.get<ApiResponse2>(`${this.endpoint}/${entreprise_uuid}/all/paginate`, { params });
  }

  getPaginatedEntrepriseByPos(entreprise_uuid: string, pos_uuid: string, page: number, pageSize: number, search: string): Observable<ApiResponse2> {
    let params = new HttpParams()
    .set("page", page.toString())
    .set("page_size", pageSize.toString())
    .set("search", search)
    return this.http.get<ApiResponse2>(`${this.endpoint}/${entreprise_uuid}/${pos_uuid}/all/paginate`, { params });
  }
 
  getPaginated(page: number, pageSize: number, search: string): Observable<ApiResponse2> {
    let params = new HttpParams()
    .set("page", page.toString())
    .set("page_size", pageSize.toString())
    .set("search", search)
    return this.http.get<ApiResponse2>(`${this.endpoint}/all/paginate`, { params });
  }

  getPaginatedById(uuid: string, page: number, pageSize: number, search: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
    return this.http.get<any>(`${this.endpoint}/all/paginate/${uuid}`, { params });
  }

  getAllByEntrepriseByPosSearch(entreprise_uuid: string, pos_uuid: string, search: string): Observable<any> {
    let params = new HttpParams() 
      .set("search", search)
    return this.http.get<any>(`${this.endpoint}/${entreprise_uuid}/${pos_uuid}/all/search`, { params });
  }
  
  getAllBySearch(search: string): Observable<any> {
    let params = new HttpParams() 
      .set("search", search)
    return this.http.get<any>(`${this.endpoint}/all/search/${search}`, { params });
  }

  getAllBySearchEntreprisePos(entreprise_uuid: string, pos_uuid: string, search: string): Observable<any> {
    return this.http.get(`${this.endpoint}/${entreprise_uuid}/${pos_uuid}/all/search/${search}`);
  }

  getTotalQty(uuid: string): Observable<any> {
    return this.http.get(`${this.endpoint}/all/total/${uuid}`);
  }

  getAllEntreprise(entreprise_uuid: string): Observable<any> {
    return this.http.get(`${this.endpoint}/${entreprise_uuid}/all`);
  }

  getAllEntreprisePos(entreprise_uuid: string, pos_uuid: string): Observable<any> {
    return this.http.get(`${this.endpoint}/${entreprise_uuid}/${pos_uuid}/all`);
  }

  getAllEntrepriseById(entreprise_uuid: string, pos_uuid: string, uuid: string): Observable<any> {
    return this.http.get(`${this.endpoint}/${entreprise_uuid}/${pos_uuid}/all/${uuid}`);
  }

  getOneEntreprisePos(entreprise_uuid: string, pos_uuid: string, uuid: string): Observable<any> {
    return this.http.get(`${this.endpoint}/${entreprise_uuid}/${pos_uuid}/one/${uuid}`);
  }


  getData(): Observable<ApiResponse2> {
    return this.http.get<ApiResponse2>(`${this.endpoint}/all`);
  }
 
  getAll(): Observable<any> {
    return this.http.get(`${this.endpoint}/all`);
  }

  getAllById(uuid: string): Observable<any> {
    return this.http.get(`${this.endpoint}/all/${uuid}`);
  }

  getAllByUUID(entreprise_uuid: string, pos_uuid: string): Observable<any> {
    return this.http.get(`${this.endpoint}/all/${entreprise_uuid}/${pos_uuid}`);
  }


  getAllByIdCount(uuid: string): Observable<any> {
    return this.http.get(`${this.endpoint}/all/count/${uuid}`);
  }

  get(uuid: string): Observable<any> {
    return this.http.get(`${this.endpoint}/get/${uuid}`);
  }

  create(data: any): Observable<any> {
    return this.http.post(`${this.endpoint}/create`, data).pipe(tap(() => {
      this._refreshDataList$.next();
      this._refreshData$.next();
    }));
  }
  
  createData(data: any): Observable<number> {
    const headers = new HttpHeaders();
    headers.append('Content-Type', 'application/json');

    return this.http.post(`${this.endpoint}/create`, data, {
      headers: headers,
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            return event.total ? Math.round((100 * event.loaded) / event.total) : 0;
          case HttpEventType.Response:
            return 100; // Téléchargement terminé
          default:
            return 0;
        }
      })
    );
  }

  update(uuid: string, data: any): Observable<any> {
    return this.http.put(`${this.endpoint}/update/${uuid}`, data).pipe(tap(() => {
      this._refreshDataList$.next();
      this._refreshData$.next();
    }));
  }


  delete(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/delete/${uuid}`).pipe(tap(() => {
      this._refreshDataList$.next();
      this._refreshData$.next();
    }));
  }

  // Get file
  getFile(url: string): Observable<any> {
    return this.http.get(`${this.endpoint}/${url}`);
  }

  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.endpoint}/uploads`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  uploadCsvData(data: any[], entreprise_uuid: string, signature: string): Observable<number> {
    const payload = {
      data,
      entreprise_uuid,
      signature
    };
    return this.http.post(`${this.endpoint}/uploads`, payload, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            return Math.round((event.loaded / event.total!) * 100);
          case HttpEventType.Response:
            return 100;
          default:
            return 0;
        }
      }),
      tap(() => {
        this._refreshDataList$.next();
        this._refreshData$.next();
      })
    );
  }

  downloadInvoice() {
    this.http.get(`${this.endpoint}/invoice`, { responseType: 'blob' }).subscribe({
      next: (response) => {
        const blob = new Blob([response], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const newWindow = window.open(url);
        if (newWindow) {
          newWindow.onload = () => {
            newWindow.print();
          };
        } else {
          console.error('Erreur lors de l\'ouverture de la nouvelle fenêtre.');
        }
      },
      error: (err) => {
        console.error('Erreur lors du téléchargement de la facture :', err);
      }
    });
  }
}