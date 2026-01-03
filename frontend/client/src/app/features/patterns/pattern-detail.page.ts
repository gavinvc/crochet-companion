import { Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { PatternDetail } from '../../core/models/pattern.model';
import { PatternService } from '../../core/services/pattern.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-pattern-detail-page',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink],
  templateUrl: './pattern-detail.page.html',
  styleUrl: './pattern-detail.page.css'
})
export class PatternDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly patterns = inject(PatternService);
  protected readonly auth = inject(AuthService);

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly pattern = signal<PatternDetail | null>(null);
  protected readonly activeRowIndex = signal(0);

  protected readonly rows = computed(() => this.pattern()?.rows ?? []);
  protected readonly activeRow = computed(() => this.rows()[this.activeRowIndex()] ?? null);

  constructor() {
    const patternId = this.route.snapshot.paramMap.get('patternId');
    if (patternId) {
      this.loadPattern(patternId);
    } else {
      this.error.set('Pattern not found.');
    }
  }

  private loadPattern(patternId: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.patterns.get(patternId).subscribe({
      next: ({ pattern }) => {
        this.pattern.set(pattern);
        this.activeRowIndex.set(0);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Could not load that pattern.');
        this.isLoading.set(false);
      }
    });
  }

  protected toggleFollow(): void {
    const current = this.pattern();
    if (!current) return;
    if (!this.auth.isLoggedIn()) {
      this.error.set('Sign in to follow patterns.');
      return;
    }

    this.patterns.toggleFollow(current.id).subscribe({
      next: ({ isFollowing, followerCount }) => {
        this.pattern.update(p => (p ? { ...p, isFollowing, followerCount } : p));
      },
      error: () => this.error.set('Unable to update follow state right now.')
    });
  }

  protected selectRow(index: number): void {
    if (index < 0 || index >= this.rows().length) return;
    this.activeRowIndex.set(index);
  }

  protected prevRow(): void {
    this.selectRow(this.activeRowIndex() - 1);
  }

  protected nextRow(): void {
    this.selectRow(this.activeRowIndex() + 1);
  }
}
