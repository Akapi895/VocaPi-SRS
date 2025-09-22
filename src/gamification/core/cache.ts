import { GamificationSummary, GamificationAnalysisData } from './types';

/**
 * Cache manager for gamification data to improve performance
 */
export class GamificationCache {
  private static instance: GamificationCache;
  private cache: Map<string, { data: GamificationSummary; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): GamificationCache {
    if (!GamificationCache.instance) {
      GamificationCache.instance = new GamificationCache();
    }
    return GamificationCache.instance;
  }

  /**
   * Generate cache key from analysis data
   */
  private generateCacheKey(data: GamificationAnalysisData): string {
    return `${data.totalWords}_${data.currentStreak}_${data.accuracy}_${data.wordDistribution.review}`;
  }

  /**
   * Get cached summary if valid
   */
  getCachedSummary(data: GamificationAnalysisData): GamificationSummary | null {
    const key = this.generateCacheKey(data);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Cache gamification summary
   */
  cacheSummary(data: GamificationAnalysisData, summary: GamificationSummary): void {
    const key = this.generateCacheKey(data);
    this.cache.set(key, {
      data: summary,
      timestamp: Date.now()
    });
  }

  /**
   * Clear expired cache entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp >= this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
  }
}

/**
 * Performance optimization wrapper for gamification summary
 */
export const getGamificationSummaryWithCache = (
  data: GamificationAnalysisData,
  generateSummary: (data: GamificationAnalysisData) => GamificationSummary
): GamificationSummary => {
  const cache = GamificationCache.getInstance();
  
  // Try to get from cache first
  const cached = cache.getCachedSummary(data);
  if (cached) {
    return cached;
  }
  
  // Generate new summary
  const summary = generateSummary(data);
  
  // Cache the result
  cache.cacheSummary(data, summary);
  
  // Clean up expired entries periodically
  if (Math.random() < 0.1) { // 10% chance to cleanup
    cache.clearExpired();
  }
  
  return summary;
};