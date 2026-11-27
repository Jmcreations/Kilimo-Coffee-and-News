import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, tap } from 'rxjs';

interface CacheEntry {
  response: HttpResponse<unknown>;
  expiresAt: number;
}

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes
const responseCache = new Map<string, CacheEntry>();

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Invalidate cached API data whenever content is created, edited, or deleted
  if (req.method !== 'GET') {
    if (req.url.includes('/news')) {
      for (const key of responseCache.keys()) {
        if (key.includes('/news')) responseCache.delete(key);
      }
    }
    if (req.url.includes('/ticker')) {
      for (const key of responseCache.keys()) {
        if (key.includes('/ticker')) responseCache.delete(key);
      }
    }
    return next(req);
  }

  // Only cache public read endpoints (never authenticated user/order endpoints)
  const isCacheableEndpoint =
    req.url.includes('/api/news') || req.url.includes('/api/ticker');

  if (!isCacheableEndpoint) {
    return next(req);
  }

  const cached = responseCache.get(req.urlWithParams);
  if (cached && cached.expiresAt > Date.now()) {
    return of(cached.response.clone());
  }

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && event.status === 200) {
        responseCache.set(req.urlWithParams, {
          response: event.clone(),
          expiresAt: Date.now() + CACHE_TTL_MS
        });
      }
    })
  );
};
