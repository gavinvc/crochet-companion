import { Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { environment } from '../../config/environment';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, NgIf, NgFor],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css'
})
export class ShellComponent {
  private readonly auth = inject(AuthService);

  protected readonly brandName = environment.appName;
  protected readonly isDevInstance = Boolean(environment.isDev);
  protected readonly isMenuOpen = signal(false);
  protected readonly currentUser = this.auth.currentUser;
  protected readonly isAuthenticated = computed(() => Boolean(this.auth.currentUser()));

  protected readonly navItems = [
    { label: 'Patterns', href: '/patterns' },
    { label: 'Pattern Parser', href: '/parser' },
    { label: 'Community', href: '/community' }
  ];

  toggleMenu(): void {
    this.isMenuOpen.update(value => !value);
  }

  logout(): void {
    this.auth.logout();
  }
}
