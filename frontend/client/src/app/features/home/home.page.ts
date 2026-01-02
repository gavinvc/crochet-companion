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
      copy: 'Coming soon: claim a maker handle, showcase WIPs, and follow crocheters who inspire you.'
    },
    {
      title: 'AI pattern parsing',
      copy: 'Coming soon: paste any pattern and watch us build tidy, row-by-row checklists with stitch counts.'
    },
    {
      title: 'Sharing & feedback',
      copy: 'Coming soon: publish patterns, gather notes, and spark conversations with detailed attachments.'
    }
  ];

  protected readonly liveRowHighlights = [
    'Coming soon: row-aware timer with rest reminders',
    'Coming soon: smart stitch calculators for repeats',
    'Coming soon: tap-to-complete tracking across devices'
  ];
}
