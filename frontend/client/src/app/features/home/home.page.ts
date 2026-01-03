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
      title: 'Pattern Parser',
      copy: 'Paste text or drop a URL to get numbered rows with stitch callouts you can walk through at your pace.'
    },
    {
      title: 'Row tracking',
      copy: 'Advance forward or backward without losing your place; tap rows to jump ahead and keep rhythm.'
    },
    {
      title: 'Sharing & feedback',
      copy: 'Publish patterns, gather notes, and invite collaborators—built to keep feedback alongside your rows.'
    }
  ];

  protected readonly liveRowHighlights = [
    'Row-by-row navigation with stitch names highlighted',
    'Text or web URLs supported; PDFs coming soon',
    'Warnings surfaced when the pattern is ambiguous'
  ];
}
