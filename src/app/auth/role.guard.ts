// role.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const roleGuard = (roles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.user();
    
    if (!user) {
      return router.parseUrl('/login');
    }
    
    const hasRole = user.roles?.some(r => roles.includes(r));
    return hasRole ? true : router.parseUrl('/unauthorized');
  };
};