import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../config/environment';
import {
  ProjectProgress,
  ProjectProgressDetail,
  ProgressStatus,
  SaveCommunityProgressPayload,
  SaveParsedProgressPayload
} from '../models/progress.model';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly baseUrl = `${environment.apiBaseUrl}/progress`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<{ inProgress: ProjectProgress[]; completed: ProjectProgress[]; summary: { completedCount: number } }> {
    return this.http
      .get<{ inProgress: ProjectProgress[]; completed: ProjectProgress[]; summary: { completedCount: number } }>(this.baseUrl)
      .pipe(catchError(() => of({ inProgress: [], completed: [], summary: { completedCount: 0 } })));
  }

  get(progressId: string): Observable<{ progress: ProjectProgressDetail }> {
    return this.http.get<{ progress: ProjectProgressDetail }>(`${this.baseUrl}/${progressId}`);
  }

  getForPattern(patternId: string): Observable<{ progress: ProjectProgressDetail | null }> {
    return this.http
      .get<{ progress: ProjectProgressDetail | null }>(`${this.baseUrl}/by-pattern/${patternId}`)
      .pipe(catchError(() => of({ progress: null })));
  }

  saveCommunity(payload: SaveCommunityProgressPayload): Observable<{ progress: ProjectProgressDetail }> {
    return this.http.post<{ progress: ProjectProgressDetail }>(this.baseUrl, {
      ...payload,
      patternType: 'community'
    });
  }

  saveParsed(payload: SaveParsedProgressPayload): Observable<{ progress: ProjectProgressDetail }> {
    return this.http.post<{ progress: ProjectProgressDetail }>(this.baseUrl, {
      ...payload,
      patternType: 'parsed'
    });
  }

  update(progressId: string, payload: { currentRowNumber?: number; status?: ProgressStatus }): Observable<{ progress: ProjectProgressDetail }> {
    return this.http.patch<{ progress: ProjectProgressDetail }>(`${this.baseUrl}/${progressId}`, payload);
  }
}
