import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule, NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, NgTemplateOutlet, UpperCasePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { PatternParserService } from '../../core/services/pattern-parser.service';
import { PatternInputType, PatternParseResponse } from '../../core/models/parser.model';

@Component({
  selector: 'app-parser-page',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, NgSwitch, NgSwitchCase, NgSwitchDefault, NgTemplateOutlet, UpperCasePipe, ReactiveFormsModule],
  templateUrl: './parser.page.html',
  styleUrl: './parser.page.css'
})
export class ParserPage {
  @ViewChild('resultsSection') private resultsSection?: ElementRef<HTMLElement>;

  private readonly fb = inject(FormBuilder);
  private readonly parser = inject(PatternParserService);
  private pdfFile: File | null = null;

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
      } else if (type === 'pdf') {
        control.clearValidators();
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

    if (payload.inputType !== 'pdf' && this.looksLikePdf(payload.content)) {
      this.error.set('PDF detected. Use the PDF upload option so we can extract text first.');
      this.isLoading.set(false);
      return;
    }

    if (payload.inputType === 'pdf') {
      if (!this.pdfFile) {
        this.error.set('Please select a PDF file to parse.');
        this.isLoading.set(false);
        return;
      }
      this.readFileAsBase64(this.pdfFile)
        .then(data => {
          this.parser.parsePdf({ data, filename: this.pdfFile?.name, title: payload.title || undefined }).subscribe({
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
        })
        .catch(() => {
          this.error.set('Unable to read PDF file.');
          this.isLoading.set(false);
        });
      return;
    }

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

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.pdfFile = file ?? null;
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
    // Angular HttpErrorResponse carries the server payload on `.error`
    if (typeof error === 'object' && error && 'error' in error) {
      const httpError = error as { error?: unknown; status?: number };
      const payload = httpError.error;

      if (typeof payload === 'string' && payload.trim().length) {
        return payload;
      }

      if (payload && typeof payload === 'object') {
        if ('message' in payload) {
          return String((payload as { message: unknown }).message);
        }
        if ('errors' in payload) {
          const fieldErrors = (payload as { errors: Record<string, string[]> }).errors;
          const firstField = Object.values(fieldErrors)[0];
          if (Array.isArray(firstField) && firstField.length) {
            return firstField[0];
          }
        }
      }

      if (httpError.status === 400) {
        return 'Invalid request. Please check your input and try again.';
      }
    }

    return 'We could not parse that pattern. Please try again with more context or a different source.';
  }

  private looksLikePdf(content: string | null | undefined): boolean {
    if (!content) return false;
    const trimmed = content.trim();
    if (trimmed.startsWith('%PDF')) return true;
    if (/^JVBER/i.test(trimmed)) return true;
    if (trimmed.startsWith('data:application/pdf')) return true;
    return false;
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          const base64 = result.split(',').pop() || '';
          resolve(base64);
        } else {
          reject(new Error('Invalid file result'));
        }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  }
}
