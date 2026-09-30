import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type StorageType = 'local' | 'session';

interface CacheEntry<T> {
  value: T;
}

/** Thin wrapper around localStorage/sessionStorage that's safe during SSR/prerendering. */
@Injectable({ providedIn: 'root' })
export class CacheService {
  private readonly platformId = inject(PLATFORM_ID);

  private getStorage(storageType: StorageType): Storage | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return storageType === 'local' ? localStorage : sessionStorage;
  }

  /** Reads and JSON-parses a cached value, or `null` if missing, unreadable, or not in a browser. */
  get<T>(key: string, storageType: StorageType = 'local'): T | null {
    const storage = this.getStorage(storageType);
    if (!storage) return null;

    const cachedRaw = storage.getItem(key);
    if (cachedRaw) {
      try {
        const cached: CacheEntry<T> = JSON.parse(cachedRaw);
        return cached.value;
      } catch {
        this.remove(key, storageType);
      }
    }
    return null;
  }

  /** JSON-stringifies and stores a value; write failures (quota, private mode) are silently ignored. */
  set<T>(key: string, value: T, storageType: StorageType = 'local'): void {
    const storage = this.getStorage(storageType);
    if (!storage) return;

    const entry: CacheEntry<T> = { value };
    try {
      storage.setItem(key, JSON.stringify(entry));
    } catch {
      // Ignore storage write failures (quota exceeded, private mode, etc.)
    }
  }

  /** Removes a stored value, if present. */
  remove(key: string, storageType: StorageType = 'local'): void {
    this.getStorage(storageType)?.removeItem(key);
  }
}
