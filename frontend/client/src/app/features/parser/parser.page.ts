import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';

type ParserStep = {
  title: string;
  detail: string;
};

type ParserBenefit = {
  label: string;
  description: string;
};

@Component({
  selector: 'app-parser-page',
  standalone: true,
  imports: [NgFor, RouterLink],
  templateUrl: './parser.page.html',
  styleUrl: './parser.page.css'
})
export class ParserPage {
  protected readonly steps: ParserStep[] = [
    { title: 'Drop in any pattern format', detail: 'Paste, upload, or link to PDFs and notes. We auto-detect abbreviations and stitch languages.' },
    { title: 'Let the parser normalize', detail: 'We translate charts to plain language, calculate stitch math, and surface potential errata.' },
    { title: 'Track rows live', detail: 'Send the cleaned pattern to your maker space with live row tracking and yarn usage projections.' }
  ];

  protected readonly benefits: ParserBenefit[] = [
    { label: 'Chart → text', description: 'Readable, mobile-friendly directions generated instantly.' },
    { label: 'Fiber-aware', description: 'Hook, yarn, and gauge guidance based on your stash profile.' },
    { label: 'Collaboration', description: 'Share a parsing room with co-makers and annotate together.' }
  ];
}
