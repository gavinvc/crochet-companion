import { Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { PatternDetail } from '../../core/models/pattern.model';
import { isSamplePatternId } from '../../core/data/sample-patterns';
import { ProjectProgressDetail, ProgressStatus } from '../../core/models/progress.model';
import { ProgressService } from '../../core/services/progress.service';

type ExpandedRow = {
  displayNumber: number;
  instruction: string;
  stitches?: string[];
  notes?: string;
  sourceRowNumber: number;
  spanSize: number;
  spanIndex: number;
};
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
  private readonly router = inject(Router);
  private readonly patterns = inject(PatternService);
  protected readonly auth = inject(AuthService);
  private readonly progressSvc = inject(ProgressService);

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly pattern = signal<PatternDetail | null>(null);
  protected readonly activeRowIndex = signal(0);
  protected readonly isSavingProgress = signal(false);
  protected readonly progressNotice = signal<string | null>(null);
  protected readonly progressError = signal<string | null>(null);
  protected readonly progress = signal<ProjectProgressDetail | null>(null);
  private pendingRowNumber: number | null = null;

  protected readonly expandedRows = computed<ExpandedRow[]>(() => {
    const current = this.pattern();
    if (!current) return [];

    const expanded: ExpandedRow[] = [];
    for (const row of current.rows) {
      const start = row.rowNumber ?? 1;
      const span = Math.max(1, row.rowSpan ?? 1);
      for (let i = 0; i < span; i++) {
        expanded.push({
          displayNumber: start + i,
          instruction: row.instruction,
          stitches: row.stitches,
          notes: row.notes,
          sourceRowNumber: start,
          spanSize: span,
          spanIndex: i
        });
      }
    }
    return expanded;
  });
  protected readonly activeRow = computed(() => this.expandedRows()[this.activeRowIndex()] ?? null);

  constructor() {
    const patternId = this.route.snapshot.paramMap.get('patternId');
    if (patternId) {
      this.loadPattern(patternId);
      this.loadProgress(patternId);
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
        const targetRow = this.pendingRowNumber ?? 0;
        this.activeRowIndex.set(this.indexForRowNumber(targetRow));
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Could not load that pattern.');
        this.isLoading.set(false);
      }
    });
  }

  private loadProgress(patternId: string): void {
    this.progressSvc.getForPattern(patternId).subscribe({
      next: ({ progress }) => {
        if (!progress) return;
        this.progress.set(progress);
        this.pendingRowNumber = progress.currentRowNumber || null;
        if (this.pattern()) {
          this.activeRowIndex.set(this.indexForRowNumber(progress.currentRowNumber));
        }
      },
      error: () => {
        this.progressError.set('Could not load saved progress.');
      }
    });
  }

  protected toggleFollow(): void {
    const current = this.pattern();
    if (!current) return;
    const isSample = isSamplePatternId(current.id);
    if (!this.auth.isLoggedIn() && !isSample) {
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

  protected saveProgress(markComplete = false): void {
    const currentPattern = this.pattern();
    if (!currentPattern) return;

    const currentRowNumber = this.currentRowNumber();
    const status: ProgressStatus = markComplete ? 'completed' : 'in-progress';

    this.isSavingProgress.set(true);
    this.progressError.set(null);
    this.progressNotice.set(null);

    const existing = this.progress();
    const isSample = isSamplePatternId(currentPattern.id);

    const request$ = existing
      ? this.progressSvc.update(existing.id, { currentRowNumber, status })
      : isSample
        ? this.progressSvc.saveParsed({
            title: currentPattern.title,
            rows: currentPattern.rows,
            currentRowNumber,
            status,
            sourceTitle: currentPattern.title,
            sourceType: 'community-sample',
            imageUrl: currentPattern.imageUrl
          })
        : this.progressSvc.saveCommunity({ patternId: currentPattern.id, currentRowNumber, status });

    request$.subscribe({
      next: ({ progress }) => {
        this.progress.set(progress);
        this.activeRowIndex.set(this.indexForRowNumber(progress.currentRowNumber));
        this.isSavingProgress.set(false);
        this.progressNotice.set(markComplete ? 'Marked as completed.' : 'Progress saved.');
      },
      error: () => {
        this.isSavingProgress.set(false);
        this.progressError.set('Could not save progress right now.');
      }
    });
  }

  protected markComplete(): void {
    this.saveProgress(true);
  }

  protected currentRowNumber(): number {
    const row = this.expandedRows()[this.activeRowIndex()];
    return row?.displayNumber ?? 1;
  }

  private indexForRowNumber(rowNumber: number | null): number {
    if (!rowNumber || rowNumber < 1) return 0;
    const rows = this.expandedRows();
    const foundIndex = rows.findIndex(r => r.displayNumber === rowNumber);
    return foundIndex === -1 ? 0 : foundIndex;
  }

  protected selectRow(index: number): void {
    if (index < 0 || index >= this.expandedRows().length) return;
    this.activeRowIndex.set(index);
  }

  protected prevRow(): void {
    this.selectRow(this.activeRowIndex() - 1);
  }

  protected nextRow(): void {
    this.selectRow(this.activeRowIndex() + 1);
  }

  protected deletePattern(): void {
    const current = this.pattern();
    if (!current || !current.isOwner) return;
    const confirmed = window.confirm('Delete this pattern? This cannot be undone.');
    if (!confirmed) return;

    this.patterns.delete(current.id).subscribe({
      next: () => {
        this.router.navigate(['/patterns']);
      },
      error: () => this.error.set('Could not delete this pattern right now.')
    });
  }
}
