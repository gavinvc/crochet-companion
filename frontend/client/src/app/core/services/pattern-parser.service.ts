import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../config/environment';
import { PatternParsePdfRequest, PatternParseRequest, PatternParseResponse } from '../models/parser.model';

@Injectable({ providedIn: 'root' })
export class PatternParserService {
  private readonly baseUrl = `${environment.apiBaseUrl}/parser`;

  constructor(private readonly http: HttpClient) {}

  parse(request: PatternParseRequest): Observable<PatternParseResponse> {
    return this.http.post<PatternParseResponse>(`${this.baseUrl}/parse`, request);
  }

  parsePdf(request: PatternParsePdfRequest): Observable<PatternParseResponse> {
    return this.http.post<PatternParseResponse>(`${this.baseUrl}/parse-pdf`, request);
  }
}
