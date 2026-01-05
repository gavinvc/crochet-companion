import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
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

type BridgeCard = {
  title: string;
  detail: string;
  cta: string;
  route: string;
  disabled?: boolean;
};

type GroupCard = {
  name: string;
  description: string;
  status: string;
  cta: string;
};

@Component({
  selector: 'app-community-page',
  standalone: true,
  imports: [NgFor, RouterLink],
  templateUrl: './community.page.html',
  styleUrl: './community.page.css'
})
export class CommunityPage {
  protected readonly heroBullets = ['Critique tables', 'Maker space bridges', 'Async studio notes'];

  protected readonly streams: CommunityStream[] = [
    {
      title: 'Pattern club critiques',
      summary: 'Focused feedback circles that pair with your maker space patterns. Launching as a community beta.',
      cadence: 'Coming soon'
    },
    {
      title: 'Slow make circles',
      summary: 'Accountability chats with prompts and progress shares. Opens after critiques are live.',
      cadence: 'Coming soon'
    },
    {
      title: 'Drop-in office hours',
      summary: 'Parser help, yarn swaps, and business questions. Time slots and chat are in progress.',
      cadence: 'Coming soon'
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

  protected readonly makerBridges: BridgeCard[] = [
    {
      title: 'Maker space',
      detail: 'Keep your published and followed patterns handy; community calls pull from this list.',
      cta: 'Open maker space',
      route: '/profile'
    },
    {
      title: 'Followed patterns',
      detail: 'Use the follow button to build a queue for critiques and slow-make circles.',
      cta: 'View patterns',
      route: '/patterns'
    }
  ];

  protected readonly groups: GroupCard[] = [
    {
      name: 'Granny Square Collective',
      description: 'Share motifs, swaps, and colorways. Posts and chat will open when groups launch.',
      status: 'Coming soon',
      cta: 'Browse & join soon'
    },
    {
      name: 'Beanies & Texture Lab',
      description: 'Ribbing tricks, fit checks, and yarn subs for hats. Posting unlocks with the beta.',
      status: 'Coming soon',
      cta: 'Browse & join soon'
    },
    {
      name: 'Mindful Makers',
      description: 'Slow-make companions, gentle accountability, and supportive chat.',
      status: 'Coming soon',
      cta: 'Browse & join soon'
    }
  ];

}
