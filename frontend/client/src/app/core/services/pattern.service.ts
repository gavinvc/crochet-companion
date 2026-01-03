import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../config/environment';
import { CreatePatternPayload, PatternDetail, PatternSummary } from '../models/pattern.model';

@Injectable({ providedIn: 'root' })
export class PatternService {
  private readonly baseUrl = `${environment.apiBaseUrl}/patterns`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<{ patterns: PatternSummary[] }> {
    return this.http.get<{ patterns: PatternSummary[] }>(this.baseUrl);
  }

  listMine(): Observable<{ patterns: PatternSummary[] }> {
    return this.http.get<{ patterns: PatternSummary[] }>(`${this.baseUrl}?scope=mine`);
  }

  listFollowing(): Observable<{ patterns: PatternSummary[] }> {
    return this.http.get<{ patterns: PatternSummary[] }>(`${this.baseUrl}?scope=following`);
  }

  get(patternId: string): Observable<{ pattern: PatternDetail }> {
    return this.http.get<{ pattern: PatternDetail }>(`${this.baseUrl}/${patternId}`);
  }

  create(payload: CreatePatternPayload): Observable<{ pattern: PatternSummary }> {
    return this.http.post<{ pattern: PatternSummary }>(this.baseUrl, payload);
  }

  toggleFollow(patternId: string): Observable<{ patternId: string; isFollowing: boolean; followerCount: number }> {
    return this.http.post<{ patternId: string; isFollowing: boolean; followerCount: number }>(
      `${this.baseUrl}/${patternId}/follow`,
      {}
    );
  }

  delete(patternId: string): Observable<{ success: boolean; patternId: string }> {
    return this.http.delete<{ success: boolean; patternId: string }>(`${this.baseUrl}/${patternId}`);
  }
}
