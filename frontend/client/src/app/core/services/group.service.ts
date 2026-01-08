import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../config/environment';
import {
  CreateGroupPayload,
  CreateMessagePayload,
  CreatePostPayload,
  GroupDetail,
  GroupMessage,
  GroupPost,
  GroupSummary
} from '../models/group.model';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private readonly baseUrl = `${environment.apiBaseUrl}/groups`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<{ groups: GroupSummary[] }> {
    return this.http.get<{ groups: GroupSummary[] }>(this.baseUrl);
  }

  get(slug: string): Observable<{ group: GroupDetail }> {
    return this.http.get<{ group: GroupDetail }>(`${this.baseUrl}/${slug}`);
  }

  create(payload: CreateGroupPayload): Observable<{ group: GroupSummary }> {
    return this.http.post<{ group: GroupSummary }>(this.baseUrl, payload);
  }

  join(groupId: string): Observable<{ groupId: string; isMember: boolean; memberCount?: number }> {
    return this.http.post<{ groupId: string; isMember: boolean; memberCount?: number }>(`${this.baseUrl}/${groupId}/join`, {});
  }

  leave(groupId: string): Observable<{ groupId: string; isMember: boolean; memberCount?: number }> {
    return this.http.post<{ groupId: string; isMember: boolean; memberCount?: number }>(`${this.baseUrl}/${groupId}/leave`, {});
  }

  listPosts(groupId: string): Observable<{ posts: GroupPost[] }> {
    return this.http.get<{ posts: GroupPost[] }>(`${this.baseUrl}/${groupId}/posts`);
  }

  createPost(groupId: string, payload: CreatePostPayload): Observable<{ post: GroupPost }> {
    return this.http.post<{ post: GroupPost }>(`${this.baseUrl}/${groupId}/posts`, payload);
  }

  listMessages(groupId: string): Observable<{ messages: GroupMessage[] }> {
    return this.http.get<{ messages: GroupMessage[] }>(`${this.baseUrl}/${groupId}/messages`);
  }

  createMessage(groupId: string, payload: CreateMessagePayload): Observable<{ message: GroupMessage }> {
    return this.http.post<{ message: GroupMessage }>(`${this.baseUrl}/${groupId}/messages`, payload);
  }
}
