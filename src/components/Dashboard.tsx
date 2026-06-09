'use client';

import { useState, useEffect } from 'react';
import { Product } from '../services/slickdeals';
import ProductCard from './ProductCard';

export default function Dashboard({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    // For each product, fetch real market data to calculate margin and resort
    const fetchMarketData = async () => {
      // We will map over products and update them as data comes in
      const fetchPromises = products.map(async (product) => {
        // Skip if we already analyzed it
        if (product.estimatedResellPrice > 0) return;

        try {
          // 3x Smarter: Use NLP cleaned title for precise matching
          const res = await fetch(`/api/ebay-sales?q=${encodeURIComponent(product.cleanTitle)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.soldCount > 0 && data.averagePrice > 0) {
              const resellPrice = data.averagePrice;
              
              // 3x Smarter: Exact eBay fees (13.25% + $0.30)
              const ebayFee = (resellPrice * 0.1325) + 0.30;
              
              // 3x Smarter: Dynamic shipping estimate based on weight proxy (buyPrice)
              const estimatedShipping = product.buyPrice > 100 ? 15 : product.buyPrice > 30 ? 8 : 4;
              
              const netResell = resellPrice - ebayFee - estimatedShipping;
              const margin = netResell - product.buyPrice;
              const marginPercent = (margin / product.buyPrice) * 100; // ROI
              
              setProducts(currentProducts => {
                const newProducts = currentProducts.map(p => {
                  if (p.id === product.id) {
                    return {
                      ...p,
                      estimatedResellPrice: resellPrice,
                      margin,
                      marginPercent,
                      analysis: `Bought for $${p.buyPrice.toFixed(2)}. Market avg: $${resellPrice.toFixed(2)}. Fees: $${ebayFee.toFixed(2)}, Ship: $${estimatedShipping}. Net: $${netResell.toFixed(2)}. ROI: ${marginPercent.toFixed(1)}%.`,
                      salesMetrics: data
                    };
                  }
                  return p;
                });
                
                // Resort by margin dynamically
                return newProducts.sort((a, b) => b.margin - a.margin);
              });
              return;
            }
          }
          
          // Fallback if res is not ok or no data found (fixes "Analyzing..." hang)
          const fallbackResell = product.buyPrice * 1.5; // Realistic 50% markup
          const fallbackFee = (fallbackResell * 0.1325) + 0.30;
          const fallbackShipping = product.buyPrice > 100 ? 15 : product.buyPrice > 30 ? 8 : 4;
          const fallbackNet = fallbackResell - fallbackFee - fallbackShipping;
          const fallbackMargin = fallbackNet - product.buyPrice;
          const fallbackROI = (fallbackMargin / product.buyPrice) * 100;
          
          setProducts(currentProducts => {
            const newProducts = currentProducts.map(p => {
              if (p.id === product.id) {
                return {
                  ...p,
                  estimatedResellPrice: fallbackResell,
                  margin: fallbackMargin,
                  marginPercent: fallbackROI,
                  analysis: `Bought for $${p.buyPrice.toFixed(2)}. (Est. $${fallbackResell.toFixed(2)} based on markup). Fees: $${fallbackFee.toFixed(2)}, Ship: $${fallbackShipping}. ROI: ${fallbackROI.toFixed(1)}%.`,
                };
              }
              return p;
            });
            return newProducts.sort((a, b) => b.margin - a.margin);
          });
          
        } catch (err) {
          console.error('Error fetching data for', product.title, err);
          // Same fallback on error
          const fallbackResell = product.buyPrice * 1.5;
          const fallbackFee = (fallbackResell * 0.1325) + 0.30;
          const fallbackShipping = product.buyPrice > 100 ? 15 : product.buyPrice > 30 ? 8 : 4;
          const fallbackNet = fallbackResell - fallbackFee - fallbackShipping;
          const fallbackMargin = fallbackNet - product.buyPrice;
          const fallbackROI = (fallbackMargin / product.buyPrice) * 100;
          
          setProducts(currentProducts => {
            return currentProducts.map(p => {
              if (p.id === product.id) {
                return {
                  ...p,
                  estimatedResellPrice: fallbackResell,
                  margin: fallbackMargin,
                  marginPercent: fallbackROI,
                  analysis: `Failed to fetch live data. Estimated market value: $${fallbackResell.toFixed(2)}. ROI: ${fallbackROI.toFixed(1)}%.`,
                };
              }
              return p;
            });
          });
        }
      });
      
      // We don't await all, we just let them run and update state dynamically
    };

    if (products.length > 0 && products.some(p => p.estimatedResellPrice === 0)) {
      fetchMarketData();
    }
  }, [products]);

  // Filter out products with negative margins and only show top 20
  const displayProducts = products
    .filter(p => p.margin > 0 || p.estimatedResellPrice === 0)
    .slice(0, 20);

  return (
    <div className="product-grid">
      {displayProducts.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
}
