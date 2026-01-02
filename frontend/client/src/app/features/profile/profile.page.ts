import { Component, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

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

  protected readonly handle = this.route.snapshot.paramMap.get('handle');
  protected readonly isPersonalSpace = !this.handle;
  protected readonly title = this.isPersonalSpace ? 'Your maker space' : `${this.handle}'s studio`;
  protected readonly subtitle = this.isPersonalSpace
    ? 'Track rows, sync parser outputs, and curate what the community sees.'
    : 'A snapshot of current makes, parser sessions, and shared notes.';

  protected readonly panels: DashboardPanel[] = [
    {
      title: 'Active projects',
      description: 'Live row tracking with session histories and yarn usage forecasts.',
      cta: 'Open tracker'
    },
    {
      title: 'Parser drafts',
      description: 'Convert pattern uploads into shareable, plain-language walkthroughs.',
      cta: 'View drafts'
    },
    {
      title: 'Collab invites',
      description: 'Approve guest editors, co-host workshops, or share limited-time links.',
      cta: 'Manage invites'
    }
  ];

  protected readonly actions: QuickAction[] = [
    { label: 'Share handle', description: 'Invite others to follow your updates and stash drops.' },
    { label: 'Request critique', description: 'Ping the pattern club for focused feedback.' },
    { label: 'Sync parser', description: 'Pair a parser output with this space for quick jumps.' }
  ];
}
