// src/utils/cacheManager.ts

import { MenuTreeNode, MenuCache } from '../types/menu.types';

/**
 * 메뉴 캐시 관리자 (Singleton)
 */
export class MenuCacheManager {
  private static instance: MenuCacheManager;
  private cache: Map<string, MenuCache>;
  private defaultDuration: number;

  private constructor(cacheDuration: number = 300000) {
    this.cache = new Map();
    this.defaultDuration = cacheDuration;
  }

  static getInstance(cacheDuration?: number): MenuCacheManager {
    if (!MenuCacheManager.instance) {
      MenuCacheManager.instance = new MenuCacheManager(cacheDuration);
    }
    return MenuCacheManager.instance;
  }

  /**
   * 캐시에서 메뉴 데이터 가져오기
   */
  get(userId: string, duration?: number): MenuTreeNode[] | null {
    const cached = this.cache.get(userId);
    
    if (!cached) {
      return null;
    }

    const maxAge = duration || this.defaultDuration;
    const now = Date.now();
    
    if (now - cached.timestamp > maxAge) {
      // 캐시 만료
      this.cache.delete(userId);
      return null;
    }

    return cached.data;
  }

  /**
   * 캐시에 메뉴 데이터 저장
   */
  set(userId: string, data: MenuTreeNode[]): void {
    const cache: MenuCache = {
      data,
      timestamp: Date.now(),
      userId
    };
    
    this.cache.set(userId, cache);
  }

  /**
   * 특정 사용자 캐시 삭제
   */
  clear(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * 모든 캐시 삭제
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * 만료된 캐시 정리
   */
  cleanup(duration?: number): void {
    const maxAge = duration || this.defaultDuration;
    const now = Date.now();
    
    this.cache.forEach((cached, userId) => {
      if (now - cached.timestamp > maxAge) {
        this.cache.delete(userId);
      }
    });
  }
}