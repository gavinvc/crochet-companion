import { Component, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, ValidatorFn, FormGroup } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { LoginPayload, RegisterPayload } from '../../core/models/user.model';

type AuthBenefit = {
  title: string;
  detail: string;
};

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, ReactiveFormsModule],
  templateUrl: './auth.page.html',
  styleUrl: './auth.page.css'
})
export class AuthPage {
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly mode = signal<'login' | 'register'>('login');
  protected readonly isSubmitting = signal(false);
  protected readonly experienceLevels = ['beginner', 'confident-beginner', 'intermediate', 'advanced', 'designer'];

  protected readonly benefits: AuthBenefit[] = [
    { title: 'Sync every parser run', detail: 'Save outputs to your maker space with one tap.' },
    { title: 'Focus-friendly timers', detail: 'Track rows with breathing reminders and context notes.' },
    { title: 'Community drop-ins', detail: 'Join critique tables and share your space with collaborators.' }
  ];

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  protected readonly registerForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, this.optionalMinLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    handle: ['', [Validators.pattern(/^[a-zA-Z0-9-]+$/), Validators.maxLength(40), this.optionalMinLength(3)]],
    experienceLevel: ['beginner', [Validators.required]]
  });

  switchMode(next: 'login' | 'register'): void {
    if (this.mode() !== next) {
      this.mode.set(next);
      this.auth.lastError.set(null);
      this.loginForm.reset({ email: '', password: '' });
      this.registerForm.reset({ displayName: '', email: '', password: '', handle: '', experienceLevel: 'beginner' });
    }
  }

  async submitLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    try {
      const payload: LoginPayload = this.loginForm.getRawValue();
      await firstValueFrom(this.auth.login(payload));
      this.router.navigateByUrl('/maker-space');
    } catch (error) {
      // handled by AuthService signaling
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async submitRegister(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    try {
      const { displayName, email, password, handle, experienceLevel } = this.registerForm.getRawValue();
      const payload: RegisterPayload = {
        displayName,
        email,
        password,
        handle: handle?.trim() || undefined,
        experienceLevel
      };
      await firstValueFrom(this.auth.register(payload));
      this.router.navigateByUrl('/maker-space');
    } catch (error) {
      // handled upstream
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected fieldError(form: FormGroup, controlName: string): string | null {
    const control = form.get(controlName);
    if (!control || (!control.touched && !control.dirty)) {
      return null;
    }

    const errors = control.errors;
    if (!errors) {
      return null;
    }

    if (errors['required']) {
      return 'This field is required.';
    }

    if (errors['email']) {
      return 'Enter a valid email address.';
    }

    if (errors['minlength']) {
      return `Must be at least ${errors['minlength'].requiredLength} characters.`;
    }

    if (errors['pattern']) {
      return 'Use letters, numbers, or hyphens only.';
    }

    if (errors['maxlength']) {
      return `Keep it under ${errors['maxlength'].requiredLength} characters.`;
    }

    return 'Please double-check this field.';
  }

  protected readableLevel(level: string): string {
    return level
      .split('-')
      .map(part => (part ? part[0].toUpperCase() + part.slice(1) : part))
      .join(' ');
  }

  private optionalMinLength(length: number): ValidatorFn {
    return control => {
      const value = typeof control.value === 'string' ? control.value.trim() : control.value;
      if (!value) {
        return null;
      }
      return value.length >= length
        ? null
        : { minlength: { requiredLength: length, actualLength: value.length } };
    };
  }
}
