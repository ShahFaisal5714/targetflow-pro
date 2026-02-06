import { useState, useCallback, useEffect } from 'react';

export interface RecentSearchItem {
  id: string;
  type: 'project' | 'quotation' | 'proforma' | 'invoice' | 'product' | 'delivery';
  label: string;
  sublabel: string;
  path: string;
  timestamp: number;
}

const STORAGE_KEY = 'crm_recent_searches';
const MAX_RECENT = 5;

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as RecentSearchItem[];
        setRecentSearches(parsed);
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  const addRecentSearch = useCallback((item: Omit<RecentSearchItem, 'timestamp'>) => {
    setRecentSearches((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((s) => s.id !== item.id);
      
      // Add new item at the beginning
      const updated = [
        { ...item, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT);
      
      // Persist to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  };
}
