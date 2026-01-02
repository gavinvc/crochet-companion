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
    { title: 'Drop in any pattern format', detail: 'Coming soon: paste, upload, or link to PDFs and notes with auto-detected abbreviations.' },
    { title: 'Let the parser normalize', detail: 'Coming soon: chart translation, stitch math, and errata surfacing.' },
    { title: 'Track rows live', detail: 'Coming soon: send cleaned patterns to your maker space with live tracking.' }
  ];

  protected readonly benefits: ParserBenefit[] = [
    { label: 'Chart → text', description: 'Coming soon: readable, mobile-friendly directions generated instantly.' },
    { label: 'Fiber-aware', description: 'Coming soon: hook, yarn, and gauge guidance based on your stash profile.' },
    { label: 'Collaboration', description: 'Coming soon: share a parsing room with co-makers and annotate together.' }
  ];
}
