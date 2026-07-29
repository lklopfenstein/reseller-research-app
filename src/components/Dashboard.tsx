import { Product } from '../services/slickdeals';
import ProductCard from './ProductCard';

function estimateProduct(product: Product): Product {
  const estimatedResellPrice = product.buyPrice * 1.5;
  const ebayFee = (estimatedResellPrice * 0.1325) + 0.30;
  const estimatedShipping = product.buyPrice > 100 ? 15 : product.buyPrice > 30 ? 8 : 4;
  const netResell = estimatedResellPrice - ebayFee - estimatedShipping;
  const margin = netResell - product.buyPrice;
  const marginPercent = (margin / product.buyPrice) * 100;

  return {
    ...product,
    estimatedResellPrice,
    margin,
    marginPercent,
    analysis: `Bought for $${product.buyPrice.toFixed(2)}. Estimated resale: $${estimatedResellPrice.toFixed(2)}. Estimated fees: $${ebayFee.toFixed(2)}, shipping: $${estimatedShipping}. Estimated net: $${netResell.toFixed(2)}. ROI: ${marginPercent.toFixed(1)}%. Verify recent sold listings before buying.`,
  };
}

export default function Dashboard({ initialProducts }: { initialProducts: Product[] }) {
  const products = initialProducts.map(estimateProduct);

  // Filter out products with negative margins and only show top 20
  const displayProducts = products
    .filter(p => p.margin > 0)
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 20);

  return (
    <div className="product-grid">
      {displayProducts.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
}
