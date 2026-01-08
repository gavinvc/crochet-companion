import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';

import { ProgressService } from '../../core/services/progress.service';
import { ProjectProgressDetail, ProgressStatus } from '../../core/models/progress.model';

type ExpandedRow = {
  displayNumber: number;
  instruction: string;
  stitches?: string[];
  notes?: string;
  sourceRowNumber: number;
  spanSize: number;
  spanIndex: number;
};

@Component({
  selector: 'app-project-page',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink],
  templateUrl: './project.page.html',
  styleUrl: './project.page.css'
})
export class ProjectPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly progressSvc = inject(ProgressService);

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly progress = signal<ProjectProgressDetail | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly notice = signal<string | null>(null);
  protected readonly saveError = signal<string | null>(null);
  protected readonly activeRowIndex = signal(0);

  protected readonly expandedRows = computed<ExpandedRow[]>(() => {
    const current = this.progress();
    if (!current || !current.rows?.length) return [];

    const rows: ExpandedRow[] = [];
    current.rows.forEach(row => {
      const start = row.rowNumber ?? rows.length + 1;
      const span = Math.max(1, row.rowSpan ?? 1);
      for (let i = 0; i < span; i += 1) {
        rows.push({
          displayNumber: start + i,
          instruction: row.instruction,
          stitches: row.stitches,
          notes: row.notes,
          sourceRowNumber: start,
          spanSize: span,
          spanIndex: i
        });
      }
    });
    return rows;
  });

  protected readonly activeRow = computed(() => this.expandedRows()[this.activeRowIndex()] ?? null);

  constructor() {
    const progressId = this.route.snapshot.paramMap.get('progressId');
    if (!progressId) {
      this.error.set('Project not found.');
      return;
    }
    this.loadProgress(progressId);
  }

  private loadProgress(progressId: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.progressSvc.get(progressId).subscribe({
      next: ({ progress }) => {
        this.progress.set(progress);
        this.activeRowIndex.set(this.indexForRowNumber(progress.currentRowNumber));
        this.isLoading.set(false);
        if (!progress.rows || !progress.rows.length) {
          this.error.set('This project has no rows to display.');
        }
      },
      error: () => {
        this.error.set('Could not load this project.');
        this.isLoading.set(false);
      }
    });
  }

  protected saveProgress(markComplete = false): void {
    const current = this.progress();
    if (!current) return;
    if (!this.expandedRows().length) {
      this.saveError.set('No rows available to track.');
      return;
    }

    const currentRowNumber = this.currentRowNumber();
    const status: ProgressStatus = markComplete ? 'completed' : 'in-progress';

    this.isSaving.set(true);
    this.notice.set(null);
    this.saveError.set(null);

    this.progressSvc.update(current.id, { currentRowNumber, status }).subscribe({
      next: ({ progress }) => {
        this.progress.set(progress);
        this.activeRowIndex.set(this.indexForRowNumber(progress.currentRowNumber));
        this.isSaving.set(false);
        this.notice.set(markComplete ? 'Marked as completed.' : 'Progress saved.');
      },
      error: () => {
        this.isSaving.set(false);
        this.saveError.set('Could not save progress right now.');
      }
    });
  }

  protected markComplete(): void {
    this.saveProgress(true);
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

  protected currentRowNumber(): number {
    const row = this.expandedRows()[this.activeRowIndex()];
    return row?.displayNumber ?? 1;
  }

  protected totalRows(): number {
    return this.expandedRows().length || (this.progress()?.rowCount ?? 0);
  }

  protected isLastRow(): boolean {
    return this.activeRowIndex() >= this.expandedRows().length - 1;
  }

  protected statusLabel(): string {
    const current = this.progress();
    if (!current) return '';
    return current.status === 'completed' ? 'Completed' : 'In progress';
  }

  private indexForRowNumber(rowNumber: number | null | undefined): number {
    if (!rowNumber || rowNumber < 1) return 0;
    const rows = this.expandedRows();
    const found = rows.findIndex(r => r.displayNumber === rowNumber);
    return found === -1 ? 0 : found;
  }
}
