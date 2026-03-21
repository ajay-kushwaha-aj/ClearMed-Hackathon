/**
 * Redis Cache Client — Phase 4
 * API response caching with TTL — hospital listings, cost aggregations, scores
 * Gracefully degrades to no-cache if Redis is unavailable
 */

import Redis from 'ioredis';
import { logger } from './logger';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (redis) return redis;

  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 3000,
    });

    redis.on('error', (err) => {
      logger.warn('[Redis] Connection error', { error: err.message });
      redis = null;
    });

    redis.on('connect', () => logger.info('[Redis] Connected'));
    return redis;
  } catch {
    logger.warn('[Redis] Failed to initialize — running without cache');
    return null;
  }
}

// ── Cache helpers ─────────────────────────────────────────────────────────

const DEFAULT_TTL = 3600; // 1 hour

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const val = await r.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = DEFAULT_TTL): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.setex(key, ttlSeconds, JSON.stringify(value));
  } catch { /* silent */ }
}

export async function cacheDelete(pattern: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    const keys = await r.keys(pattern);
    if (keys.length > 0) await r.del(...keys);
  } catch { /* silent */ }
}

export async function cacheClear(prefix: string): Promise<number> {
  const r = getRedis();
  if (!r) return 0;
  try {
    const keys = await r.keys(`${prefix}*`);
    if (keys.length > 0) await r.del(...keys);
    return keys.length;
  } catch {
    return 0;
  }
}

// ── Cache key builders ────────────────────────────────────────────────────

export const CacheKeys = {
  hospitals: (filters: string) => `hospitals:list:${filters}`,
  hospital: (id: string) => `hospitals:detail:${id}`,
  treatmentList: () => 'treatments:list',
  score: (hId: string, tId: string) => `scores:${hId}:${tId}`,
  leaderboard: (city?: string) => `community:leaderboard:${city || 'all'}`,
  platformStats: () => 'intelligence:platform-stats',
  costIntelligence: (slug: string, city: string) => `intelligence:${slug}:${city}`,
  searchResults: (q: string) => `search:${q}`,
};

// ── Cache middleware factory ──────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';

export function withCache(keyFn: (req: Request) => string, ttl = DEFAULT_TTL) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyFn(req);
    const cached = await cacheGet(key);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }
    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      cacheSet(key, body, ttl).catch(() => {});
      return originalJson(body);
    };
    next();
  };
}
