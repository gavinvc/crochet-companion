import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';

type CommunityStream = {
  title: string;
  summary: string;
  cadence: string;
};

type Spotlight = {
  name: string;
  project: string;
  detail: string;
};

@Component({
  selector: 'app-community-page',
  standalone: true,
  imports: [NgFor, RouterLink],
  templateUrl: './community.page.html',
  styleUrl: './community.page.css'
})
export class CommunityPage {
  protected readonly streams: CommunityStream[] = [
    {
      title: 'Pattern club critiques',
      summary: 'Coming soon: weekly studio calls for WIPs, troubleshooting, and fiber wisdom.',
      cadence: 'Launching soon'
    },
    {
      title: 'Slow make circles',
      summary: 'Coming soon: seasonal accountability chats with journal prompts and mindful crochet sessions.',
      cadence: 'Launching soon'
    },
    {
      title: 'Drop-in office hours',
      summary: 'Coming soon: focused slots for parser help, yarn subs, or business advice.',
      cadence: 'Launching soon'
    }
  ];

  protected readonly spotlights: Spotlight[] = [
    {
      name: 'Your name here',
      project: 'Future spotlight',
      detail: 'We will showcase real makers once the community beta opens.'
    },
    {
      name: 'Community collaborations',
      project: 'Coming soon',
      detail: 'Collaborative drives and showcases will appear here after launch.'
    }
  ];
}
