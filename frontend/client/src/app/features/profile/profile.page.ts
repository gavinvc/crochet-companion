import { Component, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { PatternService } from '../../core/services/pattern.service';
import { PatternSummary } from '../../core/models/pattern.model';

type DashboardPanel = {
  title: string;
  description: string;
  cta: string;
};

type QuickAction = {
  label: string;
  description: string;
};

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.css'
})
export class ProfilePage {
  private readonly route = inject(ActivatedRoute);
  private readonly patternsSvc = inject(PatternService);

  protected readonly handle = this.route.snapshot.paramMap.get('handle');
  protected readonly isPersonalSpace = !this.handle;
  protected readonly title = this.isPersonalSpace ? 'Your maker space' : `${this.handle}'s studio`;
  protected readonly subtitle = this.isPersonalSpace
    ? 'Your published and followed patterns live here. Dashboards and history are on the way.'
    : 'Profiles arrive soon; in the meantime Pattern Parser is ready for your patterns.';

  protected readonly myPatterns = signal<PatternSummary[]>([]);
  protected readonly followedPatterns = signal<PatternSummary[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly isLoading = signal(false);

  protected readonly panels: DashboardPanel[] = [
    {
      title: 'Active projects',
      description: 'Coming soon: live row tracking with session histories and yarn usage forecasts.',
      cta: 'Coming soon'
    },
    {
      title: 'Parser drafts',
      description: 'Coming soon: convert pattern uploads into shareable, plain-language walkthroughs.',
      cta: 'Coming soon'
    },
    {
      title: 'Collab invites',
      description: 'Coming soon: approve guest editors, co-host workshops, or share limited-time links.',
      cta: 'Coming soon'
    }
  ];

  protected readonly actions: QuickAction[] = [
    { label: 'Share handle', description: 'Coming soon: invite others to follow your updates and stash drops.' },
    { label: 'Request critique', description: 'Coming soon: ping the pattern club for focused feedback.' },
    { label: 'Sync parser', description: 'Coming soon: pair a Pattern Parser output with this space for quick jumps.' }
  ];

  constructor() {
    if (this.isPersonalSpace) {
      this.loadMyPatterns();
      this.loadFollowedPatterns();
    }
  }

  private loadMyPatterns(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.patternsSvc.listMine().subscribe({
      next: ({ patterns }) => this.myPatterns.set(patterns),
      error: () => {
        this.error.set('Could not load your patterns right now.');
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false)
    });
  }

  private loadFollowedPatterns(): void {
    this.patternsSvc.listFollowing().subscribe({
      next: ({ patterns }) => this.followedPatterns.set(patterns),
      error: () => this.error.set('Could not load followed patterns right now.')
    });
  }

  protected rowsPreview(pattern: PatternSummary): string {
    return `${pattern.rowCount} rows`;
  }

  protected deletePattern(pattern: PatternSummary): void {
    if (!pattern.isOwner) return;
    const confirmed = window.confirm('Delete this pattern? This cannot be undone.');
    if (!confirmed) return;

    this.patternsSvc.delete(pattern.id).subscribe({
      next: () => {
        this.myPatterns.update(list => list.filter(item => item.id !== pattern.id));
        this.followedPatterns.update(list => list.filter(item => item.id !== pattern.id));
      },
      error: () => this.error.set('Could not delete this pattern right now.')
    });
  }
}
