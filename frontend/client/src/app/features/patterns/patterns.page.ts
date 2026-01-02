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
      summary: 'Modern silhouettes with annotated checkpoints, perfect for sweaters and layering pieces.',
      tag: 'Wearables',
      meta: '12 curated cardigans • 4 yarn stories'
    },
    {
      title: 'Mindful Rows',
      summary: 'Meditative blankets and motifs paced for nightly wind-down stitching.',
      tag: 'Calm makes',
      meta: '8 textured blankets • Breathwork cues'
    },
    {
      title: 'Playful Keepsakes',
      summary: 'Amigurumi sets with color-matching tips and stash-friendly substitutions.',
      tag: 'Amigurumi',
      meta: '15 characters • Palette planner'
    },
    {
      title: 'Heirloom Moments',
      summary: 'Bridal, baby, and ceremony-ready lacework with row-by-row translation to plain language.',
      tag: 'Heritage',
      meta: '9 heirloom prompts • Blocking guides'
    }
  ];

  protected readonly quickFilters = ['Wearables', 'Accessories', 'Keepsakes', 'Baby', 'Mindful rows'];

  protected readonly heroStats: PatternStat[] = [
    { label: 'Patterns tracked', value: '2,180+' },
    { label: 'Makers active', value: '8,400' },
    { label: 'Avg. focus session', value: '42m' }
  ];
}
