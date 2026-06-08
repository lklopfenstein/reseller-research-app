'use client';

import { useState, useEffect } from 'react';

export default function SalesMetrics({ query }: { query: string }) {
  const [data, setData] = useState<{ soldCount: number; averagePrice: number; recentDates: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch(`/api/ebay-sales?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMetrics();
  }, [query]);

  if (loading) {
    return (
      <div className="metrics-loading">
        <span className="pulse-dot"></span> Analyzing live market velocity...
      </div>
    );
  }

  if (error || !data || data.soldCount === 0) {
    return (
      <div className="metrics-error">
        <span>No recent sales data found. Item may be slow-moving.</span>
      </div>
    );
  }

  // Calculate velocity: how many days ago was the 5th sale?
  // (Simplified logic: we just show how many sold recently)
  const velocityScore = data.soldCount > 20 ? 'High' : data.soldCount > 5 ? 'Medium' : 'Low';
  const velocityColor = velocityScore === 'High' ? 'var(--success)' : velocityScore === 'Medium' ? '#f59e0b' : '#ef4444';

  return (
    <div className="market-metrics">
      <div className="metrics-row">
        <span className="metrics-label">Avg Sold Price:</span>
        <span className="metrics-value">${data.averagePrice.toFixed(2)}</span>
      </div>
      <div className="metrics-row">
        <span className="metrics-label">Sales Velocity:</span>
        <span className="metrics-value" style={{ color: velocityColor }}>
          {velocityScore} ({data.soldCount} recent sales)
        </span>
      </div>
      <div className="metrics-row">
        <span className="metrics-label">Last Sold:</span>
        <span className="metrics-value">{data.recentDates[0] || 'Unknown'}</span>
      </div>
    </div>
  );
}
