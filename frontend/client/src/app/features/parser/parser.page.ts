import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { PatternParserService } from '../../core/services/pattern-parser.service';
import { PatternInputType, PatternParseResponse } from '../../core/models/parser.model';

@Component({
  selector: 'app-parser-page',
  standalone: true,
  imports: [NgIf, NgFor, UpperCasePipe, ReactiveFormsModule],
  templateUrl: './parser.page.html',
  styleUrl: './parser.page.css'
})
export class ParserPage {
  @ViewChild('resultsSection') private resultsSection?: ElementRef<HTMLElement>;

  private readonly fb = inject(FormBuilder);
  private readonly parser = inject(PatternParserService);

  protected readonly form = this.fb.group({
    inputType: this.fb.control<PatternInputType>('text', { nonNullable: true }),
    title: this.fb.control<string>('', { nonNullable: true }),
    content: this.fb.control<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10)]
    })
  });

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly result = signal<PatternParseResponse | null>(null);
  protected readonly activeRowIndex = signal(0);
  protected readonly rows = computed(() => this.result()?.rows ?? []);
  protected readonly activeRow = computed(() => this.rows()[this.activeRowIndex()] ?? null);

  constructor() {
    this.form.controls.inputType.valueChanges.subscribe(type => {
      const control = this.form.controls.content;
      if (type === 'url') {
        control.setValidators([Validators.required, Validators.pattern(/^https?:\/\//i)]);
      } else {
        control.setValidators([Validators.required, Validators.minLength(10)]);
      }
      control.updateValueAndValidity({ emitEvent: false });
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.result.set(null);
    this.activeRowIndex.set(0);

    const payload = this.form.getRawValue();

    this.scrollToResults(true);

    this.parser.parse(payload).subscribe({
      next: response => {
        this.result.set(response);
        this.activeRowIndex.set(0);
        this.isLoading.set(false);
        this.scrollToResults();
      },
      error: err => {
        this.error.set(this.extractMessage(err));
        this.isLoading.set(false);
      }
    });
  }

  protected selectRow(index: number): void {
    if (index < 0 || index >= this.rows().length) {
      return;
    }
    this.activeRowIndex.set(index);
  }

  protected prevRow(): void {
    this.selectRow(this.activeRowIndex() - 1);
  }

  protected nextRow(): void {
    this.selectRow(this.activeRowIndex() + 1);
  }

  protected hasResult(): boolean {
    return this.rows().length > 0;
  }

  protected scrollToResults(triggeredBySubmit = false): void {
    const scroll = () => {
      const el = this.resultsSection?.nativeElement || document.querySelector('#results-section');
      if (!el) return;
      const rect = (el as HTMLElement).getBoundingClientRect();
      const top = rect.top + window.scrollY - 12;
      window.scrollTo({ top, behavior: triggeredBySubmit ? 'smooth' : 'smooth' });
    };

    requestAnimationFrame(() => setTimeout(scroll, 0));
  }

  private extractMessage(error: unknown): string {
    if (typeof error === 'object' && error && 'error' in error) {
      const payload = (error as { error?: Record<string, unknown> }).error;
      if (payload && typeof payload === 'object') {
        if ('message' in payload) {
          return String(payload['message']);
        }
        if ('errors' in payload) {
          const fieldErrors = payload['errors'] as Record<string, string[]>;
          const firstField = Object.values(fieldErrors)[0];
          if (Array.isArray(firstField) && firstField.length) {
            return firstField[0];
          }
        }
      }
    }
    return 'We could not parse that pattern. Please try again with more context or a different source.';
  }
}
