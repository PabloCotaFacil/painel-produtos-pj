'use client';

import { useEffect } from 'react';

export default function SearchResultsAnchor({ query }: { query?: string }) {
  useEffect(() => {
    if (query && query.trim().length > 0) {
      // Smooth scroll directly to the search results section
      const timer = setTimeout(() => {
        const target = document.getElementById('materiais-section');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [query]);

  return null;
}
