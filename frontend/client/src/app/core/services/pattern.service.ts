import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  deleteSamplePattern,
  getSampleFollowing,
  getSampleMine,
  getSamplePatternDetail,
  getSampleSummaries,
  isSamplePatternId,
  toggleSampleFollow
} from '../data/sample-patterns';

import { environment } from '../../config/environment';
import { CreatePatternPayload, PatternDetail, PatternSummary } from '../models/pattern.model';

@Injectable({ providedIn: 'root' })
export class PatternService {
  private readonly baseUrl = `${environment.apiBaseUrl}/patterns`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<{ patterns: PatternSummary[] }> {
    return this.http.get<{ patterns: PatternSummary[] }>(this.baseUrl).pipe(
      catchError(() => of({ patterns: getSampleSummaries() }))
    );
  }

  listMine(): Observable<{ patterns: PatternSummary[] }> {
    return this.http.get<{ patterns: PatternSummary[] }>(`${this.baseUrl}?scope=mine`).pipe(
      catchError(() => of({ patterns: getSampleMine() }))
    );
  }

  listFollowing(): Observable<{ patterns: PatternSummary[] }> {
    return this.http.get<{ patterns: PatternSummary[] }>(`${this.baseUrl}?scope=following`).pipe(
      catchError(() => of({ patterns: getSampleFollowing() }))
    );
  }

  get(patternId: string): Observable<{ pattern: PatternDetail }> {
    if (isSamplePatternId(patternId)) {
      const sample = getSamplePatternDetail(patternId);
      if (sample) return of({ pattern: sample });
    }

    return this.http.get<{ pattern: PatternDetail }>(`${this.baseUrl}/${patternId}`).pipe(
      catchError(error => {
        const sample = getSamplePatternDetail(patternId);
        if (sample) return of({ pattern: sample });
        return throwError(() => error);
      })
    );
  }

  create(payload: CreatePatternPayload): Observable<{ pattern: PatternSummary }> {
    return this.http.post<{ pattern: PatternSummary }>(this.baseUrl, payload);
  }

  toggleFollow(patternId: string): Observable<{ patternId: string; isFollowing: boolean; followerCount: number }> {
    if (isSamplePatternId(patternId)) {
      const updated = toggleSampleFollow(patternId);
      if (!updated) {
        return throwError(() => new Error('Sample pattern not found'));
      }
      return of({ patternId, ...updated });
    }

    return this.http
      .post<{ patternId: string; isFollowing: boolean; followerCount: number }>(`${this.baseUrl}/${patternId}/follow`, {})
      .pipe(
        catchError(error => {
          const updated = toggleSampleFollow(patternId);
          if (updated) return of({ patternId, ...updated });
          return throwError(() => error);
        })
      );
  }

  delete(patternId: string): Observable<{ success: boolean; patternId: string }> {
    if (isSamplePatternId(patternId)) {
      const success = deleteSamplePattern(patternId);
      if (!success) return throwError(() => new Error('Sample pattern not found'));
      return of({ success: true, patternId });
    }

    return this.http.delete<{ success: boolean; patternId: string }>(`${this.baseUrl}/${patternId}`).pipe(
      catchError(error => {
        const success = deleteSamplePattern(patternId);
        if (success) return of({ success: true, patternId });
        return throwError(() => error);
      })
    );
  }
}
