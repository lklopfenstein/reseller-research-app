import { Product } from '../services/slickdeals';

export default function ProductCard({ product, index }: { product: Product; index: number }) {
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
          <span className="price-value sell">${product.estimatedResellPrice.toFixed(2)}</span>
        </div>
        <div className="margin-box">
          <span className="price-label">Profit</span>
          <div className="margin-value">+${product.margin.toFixed(2)}</div>
          <div className="margin-percent">+{product.marginPercent.toFixed(0)}%</div>
        </div>
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
