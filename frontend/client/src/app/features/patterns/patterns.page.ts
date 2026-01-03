import { Component, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { PatternService } from '../../core/services/pattern.service';
import { PatternSummary, PatternRow } from '../../core/models/pattern.model';
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

  protected readonly patterns = signal<PatternSummary[]>([]);
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
  }

  private loadPatterns(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.patternsSvc.list().subscribe({
      next: ({ patterns }) => this.patterns.set(patterns),
      error: () => this.error.set('Could not load patterns right now.'),
      complete: () => this.isLoading.set(false)
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
    if (!this.auth.isLoggedIn()) {
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
      },
      error: () => this.error.set('Unable to update follow state right now.')
    });
  }

  protected rowsPreview(pattern: PatternSummary): string {
    return `${pattern.rowCount} rows`;
  }

  protected openPattern(pattern: PatternSummary): void {
    if (!this.auth.isLoggedIn()) {
      this.error.set('Sign in to view patterns.');
      return;
    }
    this.router.navigate(['/patterns', pattern.id]);
  }

  private parseRows(input: string): PatternRow[] {
    return input
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((instruction, index) => ({ rowNumber: index + 1, instruction }));
  }
}
