import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private store = new Map<string, CacheEntry<unknown>>();
  private readonly maxSize = 500;

  set<T>(key: string, value: T, ttlMs: number): void {
    if (this.store.size >= this.maxSize) this.evict();
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  private evict(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key);
    }

    if (this.store.size >= this.maxSize) {
      const keys = [...this.store.keys()].slice(
        0,
        Math.floor(this.maxSize * 0.2),
      );
      keys.forEach((k) => this.store.delete(k));
    }
  }
}
