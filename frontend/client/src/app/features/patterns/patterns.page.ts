import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';

type PatternCollection = {
  title: string;
  summary: string;
  tag: string;
  meta: string;
};

type PatternStat = {
  label: string;
  value: string;
};

@Component({
  selector: 'app-patterns-page',
  standalone: true,
  imports: [NgFor, RouterLink],
  templateUrl: './patterns.page.html',
  styleUrl: './patterns.page.css'
})
export class PatternsPage {
  protected readonly collections: PatternCollection[] = [
    {
      title: 'Studio Staples',
      summary: 'Coming soon: modern silhouettes with annotated checkpoints for sweaters and layers.',
      tag: 'Wearables',
      meta: 'Launching soon'
    },
    {
      title: 'Mindful Rows',
      summary: 'Coming soon: meditative blankets and motifs paced for nightly wind-down stitching.',
      tag: 'Calm makes',
      meta: 'Launching soon'
    },
    {
      title: 'Playful Keepsakes',
      summary: 'Coming soon: amigurumi sets with color-matching tips and stash-friendly substitutions.',
      tag: 'Amigurumi',
      meta: 'Launching soon'
    },
    {
      title: 'Heirloom Moments',
      summary: 'Coming soon: bridal, baby, and ceremony-ready lacework translated to plain language.',
      tag: 'Heritage',
      meta: 'Launching soon'
    }
  ];

  protected readonly quickFilters = ['Wearables (coming soon)', 'Accessories (coming soon)', 'Keepsakes (coming soon)', 'Baby (coming soon)', 'Mindful rows (coming soon)'];

  protected readonly heroStats: PatternStat[] = [
    { label: 'Patterns tracked', value: 'Coming soon' },
    { label: 'Makers active', value: 'Coming soon' },
    { label: 'Avg. focus session', value: 'Coming soon' }
  ];
}
