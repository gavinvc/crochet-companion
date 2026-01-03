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
    ? 'Use Pattern Parser now; maker space dashboards and row history are coming next.'
    : 'Profiles arrive soon; in the meantime Pattern Parser is ready for your patterns.';

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
}
