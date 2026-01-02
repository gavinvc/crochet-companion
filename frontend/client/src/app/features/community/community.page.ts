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
      summary: 'Weekly studio calls where we share WIPs, troubleshoot rows, and trade fiber wisdom.',
      cadence: 'Thursdays · Live'
    },
    {
      title: 'Slow make circles',
      summary: 'Seasonal accountability chats that pair journal prompts with mindful crochet sessions.',
      cadence: 'Daily threads · Async'
    },
    {
      title: 'Drop-in office hours',
      summary: 'Ask for parser help, yarn subs, or business advice in a focused 25-minute slot.',
      cadence: 'Weekdays · 10 slots'
    }
  ];

  protected readonly spotlights: Spotlight[] = [
    {
      name: 'Layla P.',
      project: 'Solar flare shawl',
      detail: 'Used parser annotations to launch a mini-collection and sold 120 kits.'
    },
    {
      name: 'The Gentle Loop Coop',
      project: 'Community heirloom drive',
      detail: 'Coordinated 48 makers to deliver blankets with live progress maps.'
    }
  ];
}
