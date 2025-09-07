import { Injectable } from '@angular/core';
import * as Papa from 'papaparse';

@Injectable({
  providedIn: 'root'
})
export class CsvService {
  constructor() {}

  parseCsv(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (result: any) => {
          resolve(result.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }
}