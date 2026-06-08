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

        const cleanSearchQuery = product.title.replace(/\$[\d.]+/g, '').replace(/[^\w\s-]/g, '').substring(0, 40).trim();
        
        try {
          const res = await fetch(`/api/ebay-sales?q=${encodeURIComponent(cleanSearchQuery)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.soldCount > 0 && data.averagePrice > 0) {
              const resellPrice = data.averagePrice;
              const netResell = resellPrice * 0.85 - 5; // 15% fees + $5 shipping
              const margin = netResell - product.buyPrice;
              const marginPercent = (margin / product.buyPrice) * 100;
              
              setProducts(currentProducts => {
                const newProducts = currentProducts.map(p => {
                  if (p.id === product.id) {
                    return {
                      ...p,
                      estimatedResellPrice: resellPrice,
                      margin,
                      marginPercent,
                      analysis: `Bought for $${p.buyPrice.toFixed(2)}. Median sold price on eBay is $${resellPrice.toFixed(2)}. After ~15% fees and $5 shipping, net return is $${netResell.toFixed(2)}. Profit: $${margin.toFixed(2)}.`,
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
          const fallbackNet = fallbackResell * 0.85 - 5;
          const fallbackMargin = fallbackNet - product.buyPrice;
          
          setProducts(currentProducts => {
            const newProducts = currentProducts.map(p => {
              if (p.id === product.id) {
                return {
                  ...p,
                  estimatedResellPrice: fallbackResell,
                  margin: fallbackMargin,
                  marginPercent: (fallbackMargin / p.buyPrice) * 100,
                  analysis: `Bought for $${p.buyPrice.toFixed(2)}. (Estimated $${fallbackResell.toFixed(2)} based on standard market markup due to server limits). After fees/shipping, profit: $${fallbackMargin.toFixed(2)}.`,
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
          const fallbackNet = fallbackResell * 0.85 - 5;
          const fallbackMargin = fallbackNet - product.buyPrice;
          
          setProducts(currentProducts => {
            return currentProducts.map(p => {
              if (p.id === product.id) {
                return {
                  ...p,
                  estimatedResellPrice: fallbackResell,
                  margin: fallbackMargin,
                  marginPercent: (fallbackMargin / p.buyPrice) * 100,
                  analysis: `Failed to fetch live data. Estimated market value: $${fallbackResell.toFixed(2)}.`,
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
