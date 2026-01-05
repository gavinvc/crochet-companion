import { Component, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { PatternService } from '../../core/services/pattern.service';
import { PatternSummary, PatternRow } from '../../core/models/pattern.model';
import { getSampleSummaries, isSamplePatternId } from '../../core/data/sample-patterns';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-patterns-page',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, ReactiveFormsModule],
  templateUrl: './patterns.page.html',
  styleUrl: './patterns.page.css'
})
export class PatternsPage {
  private readonly patternsSvc = inject(PatternService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly samplePatterns = getSampleSummaries();

  protected readonly patterns = signal<PatternSummary[]>([]);
  protected readonly myPatterns = signal<PatternSummary[]>([]);
  protected readonly followedPatterns = signal<PatternSummary[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly shareForm = this.fb.group({
    title: this.fb.control('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(160)] }),
    description: this.fb.control('', { nonNullable: true, validators: [Validators.maxLength(600)] }),
    imageUrl: this.fb.control('', { nonNullable: true }),
    rowsInput: this.fb.control('', { nonNullable: true, validators: [Validators.required, Validators.minLength(5)] })
  });

  constructor() {
    this.loadPatterns();
    this.loadMyPatterns();
    this.loadFollowedPatterns();
  }

  private loadPatterns(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.patternsSvc.list().subscribe({
      next: ({ patterns }) => this.patterns.set(this.mergeWithSamples(patterns)),
      error: () => this.error.set('Could not load patterns right now.'),
      complete: () => this.isLoading.set(false)
    });
  }

  private loadMyPatterns(): void {
    if (!this.auth.isLoggedIn()) {
      this.myPatterns.set([]);
      return;
    }
    this.patternsSvc.listMine().subscribe({
      next: ({ patterns }) => this.myPatterns.set(patterns),
      error: () => this.myPatterns.set([])
    });
  }

  private loadFollowedPatterns(): void {
    if (!this.auth.isLoggedIn()) {
      this.followedPatterns.set([]);
      return;
    }
    this.patternsSvc.listFollowing().subscribe({
      next: ({ patterns }) => this.followedPatterns.set(patterns),
      error: () => this.followedPatterns.set([])
    });
  }

  protected sharePattern(): void {
    if (!this.auth.isLoggedIn()) {
      this.error.set('Sign in to share a pattern.');
      return;
    }

    if (this.shareForm.invalid) {
      this.shareForm.markAllAsTouched();
      return;
    }

    const rows = this.parseRows(this.shareForm.controls.rowsInput.value);
    if (!rows.length) {
      this.error.set('Add at least one row.');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const payload = {
      title: this.shareForm.controls.title.value.trim(),
      description: this.shareForm.controls.description.value.trim(),
      imageUrl: this.shareForm.controls.imageUrl.value.trim(),
      rows
    };

    this.patternsSvc.create(payload).subscribe({
      next: ({ pattern }) => {
        this.patterns.update(list => [pattern, ...list]);
        this.shareForm.reset({ title: '', description: '', imageUrl: '', rowsInput: '' });
        this.isSubmitting.set(false);
      },
      error: () => {
        this.error.set('Could not share that pattern. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }

  protected toggleFollow(pattern: PatternSummary): void {
    const isSample = isSamplePatternId(pattern.id);
    if (!this.auth.isLoggedIn() && !isSample) {
      this.error.set('Sign in to follow patterns.');
      return;
    }

    this.patternsSvc.toggleFollow(pattern.id).subscribe({
      next: ({ isFollowing, followerCount }) => {
        this.patterns.update(list =>
          list.map(item =>
            item.id === pattern.id
              ? { ...item, isFollowing, followerCount }
              : item
          )
        );
        this.myPatterns.update(list =>
          list.map(item => (item.id === pattern.id ? { ...item, isFollowing, followerCount } : item))
        );
        this.followedPatterns.update(list => {
          const exists = list.some(item => item.id === pattern.id);
          if (isFollowing && !exists) {
            const found = this.patterns().find(p => p.id === pattern.id) || pattern;
            return [{ ...found, isFollowing, followerCount }, ...list];
          }
          if (!isFollowing) {
            return list.filter(item => item.id !== pattern.id);
          }
          return list.map(item => (item.id === pattern.id ? { ...item, isFollowing, followerCount } : item));
        });
      },
      error: () => this.error.set('Unable to update follow state right now.')
    });
  }

  protected deletePattern(pattern: PatternSummary): void {
    if (!pattern.isOwner) return;
    const confirmed = window.confirm('Delete this pattern? This cannot be undone.');
    if (!confirmed) return;

    this.patternsSvc.delete(pattern.id).subscribe({
      next: () => {
        this.patterns.update(list => list.filter(item => item.id !== pattern.id));
        this.myPatterns.update(list => list.filter(item => item.id !== pattern.id));
        this.followedPatterns.update(list => list.filter(item => item.id !== pattern.id));
      },
      error: () => this.error.set('Could not delete this pattern right now.')
    });
  }

  protected rowsPreview(pattern: PatternSummary): string {
    return `${pattern.rowCount} rows`;
  }

  protected openPattern(pattern: PatternSummary): void {
    const isSample = isSamplePatternId(pattern.id);
    if (!this.auth.isLoggedIn() && !isSample) {
      this.error.set('Sign in to view patterns.');
      return;
    }
    this.router.navigate(['/patterns', pattern.id]);
  }

  private mergeWithSamples(fetched: PatternSummary[]): PatternSummary[] {
    const merged = [...this.samplePatterns, ...fetched];
    const map = new Map<string, PatternSummary>();
    for (const item of merged) {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    }
    return Array.from(map.values());
  }

  private parseRows(input: string): PatternRow[] {
    const lines = input
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const rows: PatternRow[] = [];
    let nextRowNumber = 1;
    const labelRegex = /^(?:rows?|rounds?)\s+(\d+)(?:\s*[-–]\s*(\d+))?\s*[:.-]?\s*(.*)$/i;

    for (const line of lines) {
      const match = labelRegex.exec(line);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : start;
        const instruction = (match[3] || '').trim();
        const rowSpan = Math.max(1, end - start + 1);
        rows.push({ rowNumber: start, rowSpan, instruction: instruction || line });
        nextRowNumber = end + 1;
        continue;
      }

      rows.push({ rowNumber: nextRowNumber, instruction: line });
      nextRowNumber += 1;
    }

    return rows;
  }
}
