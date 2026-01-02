import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-home-page',
  imports: [RouterLink, NgFor],
  templateUrl: './home.page.html',
  styleUrl: './home.page.css'
})
export class HomePage {
  protected readonly featurePillars = [
    {
      title: 'Profiles & following',
      copy: 'Claim a maker handle, showcase WIPs, and follow crocheters who inspire you.'
    },
    {
      title: 'AI pattern parsing',
      copy: 'Paste any pattern or drop a link. We break it into tidy, row-by-row checklists with stitch counts.'
    },
    {
      title: 'Sharing & feedback',
      copy: 'Publish patterns, gather upvotes, and spark conversations with detailed notes and attachments.'
    }
  ];

  protected readonly liveRowHighlights = [
    'Row-aware timer with rest reminders',
    'Smart stitch calculators for repeats',
    'Tap-to-complete tracking across devices'
  ];
}
