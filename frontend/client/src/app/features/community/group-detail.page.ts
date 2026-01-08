import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { GroupService } from '../../core/services/group.service';
import { GroupDetail, GroupMessage, GroupPost } from '../../core/models/group.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-group-detail-page',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, ReactiveFormsModule, DatePipe],
  templateUrl: './group-detail.page.html',
  styleUrl: './group-detail.page.css'
})
export class GroupDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly groupsSvc = inject(GroupService);
  protected readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly group = signal<GroupDetail | null>(null);
  protected readonly posts = signal<GroupPost[]>([]);
  protected readonly messages = signal<GroupMessage[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly postError = signal<string | null>(null);
  protected readonly messageError = signal<string | null>(null);
  protected readonly isSavingPost = signal(false);
  protected readonly isSavingMessage = signal(false);

  protected readonly postForm = this.fb.group({
    content: this.fb.control('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(2000)] }),
    patternId: this.fb.control('', { nonNullable: true })
  });

  protected readonly messageForm = this.fb.group({
    body: this.fb.control('', { nonNullable: true, validators: [Validators.required, Validators.minLength(1), Validators.maxLength(1000)] })
  });

  protected readonly isMember = computed(() => Boolean(this.group()?.isMember));

  constructor() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadGroup(slug);
    } else {
      this.error.set('Group not found.');
    }
  }

  private loadGroup(slug: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.groupsSvc.get(slug).subscribe({
      next: ({ group }) => {
        this.group.set(group);
        this.isLoading.set(false);
        if (group.isMember) {
          this.loadPosts();
          this.loadMessages();
        }
      },
      error: () => {
        this.error.set('Could not load this group.');
        this.isLoading.set(false);
      }
    });
  }

  protected join(): void {
    const current = this.group();
    if (!current) return;
    if (!this.auth.isLoggedIn()) {
      this.error.set('Sign in to join.');
      return;
    }
    this.groupsSvc.join(current.id).subscribe({
      next: ({ memberCount }) => {
        this.group.update(g => (g ? { ...g, isMember: true, memberCount: memberCount ?? g.memberCount + 1 } : g));
        this.loadPosts();
        this.loadMessages();
      },
      error: () => this.error.set('Could not join right now.')
    });
  }

  protected leave(): void {
    const current = this.group();
    if (!current) return;
    if (!this.auth.isLoggedIn()) {
      this.error.set('Sign in to leave.');
      return;
    }
    this.groupsSvc.leave(current.id).subscribe({
      next: ({ memberCount }) => {
        this.group.update(g => (g ? { ...g, isMember: false, memberCount: memberCount ?? Math.max(0, g.memberCount - 1) } : g));
        this.posts.set([]);
        this.messages.set([]);
      },
      error: () => this.error.set('Could not update membership right now.')
    });
  }

  protected loadPosts(): void {
    const current = this.group();
    if (!current) return;
    this.groupsSvc.listPosts(current.id).subscribe({
      next: ({ posts }) => this.posts.set(posts),
      error: () => this.postError.set('Could not load posts.')
    });
  }

  protected loadMessages(): void {
    const current = this.group();
    if (!current) return;
    this.groupsSvc.listMessages(current.id).subscribe({
      next: ({ messages }) => this.messages.set(messages),
      error: () => this.messageError.set('Could not load chat messages.')
    });
  }

  protected createPost(): void {
    const current = this.group();
    if (!current) return;
    if (!current.isMember) {
      this.postError.set('Join to post.');
      return;
    }
    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      return;
    }

    const patternId = this.postForm.controls.patternId.value.trim();
    const content = this.postForm.controls.content.value.trim();

    this.isSavingPost.set(true);
    this.postError.set(null);

    this.groupsSvc
      .createPost(current.id, {
        content,
        patternId: patternId || undefined
      })
      .subscribe({
        next: ({ post }) => {
          this.posts.update(list => [post, ...list]);
          this.group.update(g => (g ? { ...g, postCount: g.postCount + 1 } : g));
          this.postForm.reset({ content: '', patternId: '' });
          this.isSavingPost.set(false);
        },
        error: () => {
          this.postError.set('Could not publish that post.');
          this.isSavingPost.set(false);
        }
      });
  }

  protected sendMessage(): void {
    const current = this.group();
    if (!current) return;
    if (!current.isMember) {
      this.messageError.set('Join to chat.');
      return;
    }
    if (this.messageForm.invalid) {
      this.messageForm.markAllAsTouched();
      return;
    }

    this.isSavingMessage.set(true);
    this.messageError.set(null);

    this.groupsSvc.createMessage(current.id, { body: this.messageForm.controls.body.value.trim() }).subscribe({
      next: ({ message }) => {
        this.messages.update(list => [message, ...list].slice(0, 50));
        this.group.update(g => (g ? { ...g, messageCount: g.messageCount + 1 } : g));
        this.messageForm.reset({ body: '' });
        this.isSavingMessage.set(false);
      },
      error: () => {
        this.messageError.set('Could not send message.');
        this.isSavingMessage.set(false);
      }
    });
  }
}
