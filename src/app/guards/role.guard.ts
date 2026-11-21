import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Allow SSR pass-through so browser hydration evaluates localStorage cleanly
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const allowedRoles = route.data?.['roles'] as UserRole[] | undefined;
  if (allowedRoles && allowedRoles.length > 0 && !authService.hasRole(...allowedRoles)) {
    authService.redirectByRole();
    return false;
  }

  return true;
};
