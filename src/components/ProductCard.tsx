import { Product } from '../services/slickdeals';

export default function ProductCard({ product, index }: { product: Product; index: number }) {
  const isAnalyzing = product.estimatedResellPrice === 0;
  const noData = product.estimatedResellPrice === -1;

  const displaySell = isAnalyzing ? 'Analyzing...' : noData ? 'Unknown' : `$${product.estimatedResellPrice.toFixed(2)}`;
  const displayMargin = isAnalyzing ? '?' : noData ? '0' : `+$${product.margin.toFixed(2)}`;
  const displayPercent = isAnalyzing ? '?' : noData ? '0' : `+${product.marginPercent.toFixed(0)}%`;

  let velocityScore = 'Unknown';
  let velocityColor = 'var(--text-secondary)';
  if (product.salesMetrics) {
    velocityScore = product.salesMetrics.soldCount > 20 ? 'High' : product.salesMetrics.soldCount > 5 ? 'Medium' : 'Low';
    velocityColor = velocityScore === 'High' ? 'var(--success)' : velocityScore === 'Medium' ? '#f59e0b' : '#ef4444';
  }

  return (
    <div className="product-card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="product-image-wrapper">
        <img src={product.imageUrl} alt={product.title} className="product-image" />
      </div>
      
      <h3 className="product-title" title={product.title}>
        {product.title}
      </h3>
      
      <div className="price-section">
        <div className="price-box">
          <span className="price-label">Buy Price</span>
          <span className="price-value buy">${product.buyPrice.toFixed(2)}</span>
        </div>
        <div className="price-box">
          <span className="price-label">Est. Sell</span>
          <span className="price-value sell">{displaySell}</span>
        </div>
        <div className="margin-box">
          <span className="price-label">Profit</span>
          <div className="margin-value">{displayMargin}</div>
          <div className="margin-percent">{displayPercent}</div>
        </div>
      </div>

      <div className="market-analysis-wrapper">
        <div className="analysis-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
          </svg>
          Live Market Data
        </div>
        {isAnalyzing ? (
          <div className="metrics-loading">
            <span className="pulse-dot"></span> Scraping eBay live...
          </div>
        ) : noData ? (
          <div className="metrics-error">No recent sales data found. Item may be slow-moving.</div>
        ) : (
          <div className="market-metrics">
            <div className="metrics-row">
              <span className="metrics-label">Avg Sold Price:</span>
              <span className="metrics-value">${product.salesMetrics.averagePrice.toFixed(2)}</span>
            </div>
            <div className="metrics-row">
              <span className="metrics-label">Sales Velocity:</span>
              <span className="metrics-value" style={{ color: velocityColor }}>
                {velocityScore} ({product.salesMetrics.soldCount} recent sales)
              </span>
            </div>
            <div className="metrics-row">
              <span className="metrics-label">Last Sold:</span>
              <span className="metrics-value">{product.salesMetrics.recentDates[0] || 'Unknown'}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="analysis-section">
        <div className="analysis-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          Arbitrage Analysis
        </div>
        <div className="analysis-content">
          {product.analysis}
        </div>
      </div>
      
      <div className="action-buttons">
        <a href={product.buyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-buy">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          Buy Deal
        </a>
        <a href={product.sellUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sell">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          Check eBay
        </a>
      </div>
    </div>
  );
}
