import { Component, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { GroupService } from '../../core/services/group.service';
import { GroupSummary } from '../../core/models/group.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-community-page',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, ReactiveFormsModule],
  templateUrl: './community.page.html',
  styleUrl: './community.page.css'
})
export class CommunityPage {
  private readonly groupsSvc = inject(GroupService);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly groups = signal<GroupSummary[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly createError = signal<string | null>(null);
  protected readonly isCreating = signal(false);
  protected readonly showCreateModal = signal(false);

  protected readonly createForm = this.fb.group({
    name: this.fb.control('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(80)] }),
    description: this.fb.control('', { nonNullable: true, validators: [Validators.maxLength(600)] }),
    coverImageUrl: this.fb.control('', { nonNullable: true }),
    tags: this.fb.control('', { nonNullable: true }),
    featuredPatternIds: this.fb.control('', { nonNullable: true })
  });

  constructor() {
    this.loadGroups();
  }

  protected loadGroups(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.groupsSvc.list().subscribe({
      next: ({ groups }) => this.groups.set(groups),
      error: () => this.error.set('Could not load groups.'),
      complete: () => this.isLoading.set(false)
    });
  }

  protected join(group: GroupSummary): void {
    if (!this.auth.isLoggedIn()) {
      this.error.set('Sign in to join groups.');
      return;
    }
    this.groupsSvc.join(group.id).subscribe({
      next: ({ memberCount }) => {
        this.groups.update(list =>
          list.map(item => (item.id === group.id ? { ...item, isMember: true, memberCount: memberCount ?? item.memberCount + 1 } : item))
        );
      },
      error: () => this.error.set('Could not join the group right now.')
    });
  }

  protected leave(group: GroupSummary): void {
    if (!this.auth.isLoggedIn()) {
      this.error.set('Sign in to leave groups.');
      return;
    }
    this.groupsSvc.leave(group.id).subscribe({
      next: ({ memberCount }) => {
        this.groups.update(list =>
          list.map(item => (item.id === group.id ? { ...item, isMember: false, memberCount: memberCount ?? Math.max(0, item.memberCount - 1) } : item))
        );
      },
      error: () => this.error.set('Could not update membership right now.')
    });
  }

  protected open(group: GroupSummary): void {
    this.router.navigate(['/community', group.slug]);
  }

  protected createGroup(): void {
    if (!this.auth.isLoggedIn()) {
      this.createError.set('Sign in to create a group.');
      return;
    }

    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const tags = this.createForm.controls.tags.value
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
    const featuredPatternIds = this.createForm.controls.featuredPatternIds.value
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);

    this.isCreating.set(true);
    this.createError.set(null);

    this.groupsSvc
      .create({
        name: this.createForm.controls.name.value.trim(),
        description: this.createForm.controls.description.value.trim(),
        coverImageUrl: this.createForm.controls.coverImageUrl.value.trim(),
        tags,
        featuredPatternIds
      })
      .subscribe({
        next: ({ group }) => {
          const hydrated = { ...group, isMember: true, role: group.role ?? 'owner' };
          this.groups.update(list => [hydrated, ...list]);
          this.createForm.reset({ name: '', description: '', coverImageUrl: '', tags: '', featuredPatternIds: '' });
          this.isCreating.set(false);
          this.closeCreateModal();
        },
        error: () => {
          this.createError.set('Could not create the group.');
          this.isCreating.set(false);
        }
      });
  }

  protected openCreateModal(): void {
    if (!this.auth.isLoggedIn()) {
      this.error.set('Sign in to create a group.');
      return;
    }
    this.createError.set(null);
    this.showCreateModal.set(true);
  }

  protected closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  protected scrollToGroups(): void {
    const el = document.getElementById('groups');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
