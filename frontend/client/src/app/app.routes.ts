import { Routes } from '@angular/router';
import { ShellComponent } from './core/layout/shell.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
	{
		path: '',
		component: ShellComponent,
		children: [
			{
				path: '',
				loadComponent: () => import('./features/home/home.page').then(m => m.HomePage)
			},
			{
				path: 'patterns/:patternId',
				canActivate: [authGuard],
				data: { requiresAuth: true },
				loadComponent: () => import('./features/patterns/pattern-detail.page').then(m => m.PatternDetailPage)
			},
			{
				path: 'patterns',
				loadComponent: () => import('./features/patterns/patterns.page').then(m => m.PatternsPage)
			},
			{
				path: 'parser',
				loadComponent: () => import('./features/parser/parser.page').then(m => m.ParserPage)
			},
			{
				path: 'community/:slug',
				loadComponent: () => import('./features/community/group-detail.page').then(m => m.GroupDetailPage)
			},
			{
				path: 'community',
				loadComponent: () => import('./features/community/community.page').then(m => m.CommunityPage)
			},
			{
				path: 'projects/:progressId',
				canActivate: [authGuard],
				data: { requiresAuth: true },
				loadComponent: () => import('./features/projects/project.page').then(m => m.ProjectPage)
			},
			{
				path: 'maker/:handle',
				loadComponent: () => import('./features/profile/profile.page').then(m => m.ProfilePage)
			},
			{
				path: 'maker-space',
				canActivate: [authGuard],
				data: { requiresAuth: true },
				loadComponent: () => import('./features/profile/profile.page').then(m => m.ProfilePage)
			}
		]
	},
	{
		path: 'auth',
		loadComponent: () => import('./features/auth/auth.page').then(m => m.AuthPage)
	},
	{ path: '**', redirectTo: '' }
];
