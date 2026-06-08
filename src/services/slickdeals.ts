import Parser from 'rss-parser';
import * as cheerio from 'cheerio';

export interface Product {
  id: string;
  title: string;
  buyUrl: string;
  imageUrl: string;
  buyPrice: number;
  estimatedResellPrice: number;
  margin: number;
  marginPercent: number;
  sellPlatform: string;
  sellUrl: string;
  analysis: string;
}

const parser = new Parser({
  customFields: {
    item: ['content:encoded'],
  },
});

function extractPrice(text: string): number | null {
  const match = text.match(/\$\s*(\d+(?:\.\d{2})?)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
}

export async function fetchArbitrageDeals(): Promise<Product[]> {
  const urls = [
    'https://slickdeals.net/newsearch.php?mode=frontpage&searcharea=deals&searchin=first&rss=1',
    'https://dealnews.com/?rss=1'
  ];
  
  const products: Product[] = [];

  for (const url of urls) {
    try {
      const feed = await parser.parseURL(url);

      for (const item of feed.items) {
        const title = item.title || '';
        const link = item.link || '';
        const anyItem = item as any;
        const content = anyItem['content:encoded'] || anyItem.content || anyItem.description || '';

        // Extract price from title or content
        let buyPrice = extractPrice(title);
    if (!buyPrice) {
      buyPrice = extractPrice(content);
    }

    if (!buyPrice || buyPrice < 5) {
      // Skip items without a clear price or very cheap items where arbitrage isn't worth shipping
      continue;
    }

    // Extract image using Cheerio
    const $ = cheerio.load(content);
    let imageUrl = $('img').first().attr('src');
    if (!imageUrl) {
      imageUrl = 'https://via.placeholder.com/300?text=No+Image';
    }

    // Since we don't have a live eBay API, we estimate the original MSRP/Resell value based on typical deal discounts (approx 40-60% off)
    // We will look for original price in the text.
    let originalPriceMatch = title.match(/(\d+(?:\.\d{2})?)\s+Reg/i) || content.match(/Regular price\s*\$?\s*(\d+(?:\.\d{2})?)/i) || content.match(/Was\s*\$?\s*(\d+(?:\.\d{2})?)/i);
    let resellPrice = 0;
    
    if (originalPriceMatch) {
      resellPrice = parseFloat(originalPriceMatch[1]);
    } else {
      // If we can't find original price, estimate it's a 40% discount
      resellPrice = buyPrice / 0.6; 
    }

    // Deduct standard 15% marketplace fee + $5 shipping
    const netResell = resellPrice * 0.85 - 5;
    const margin = netResell - buyPrice;
    
    // Skip if margin is negative or too small
    if (margin <= 0) continue;

    const marginPercent = (margin / buyPrice) * 100;

    // Create a clean search term for eBay
    const cleanTitle = title.replace(/\$[\d.]+/g, '').replace(/[^\w\s-]/g, '').substring(0, 50).trim();
    const ebaySearchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(cleanTitle)}`;

    const analysis = `Bought for $${buyPrice.toFixed(2)}. Estimated market value $${resellPrice.toFixed(2)}. After ~15% fees and $5 shipping, net return is $${netResell.toFixed(2)}. This leaves a profit of $${margin.toFixed(2)}.`;

    products.push({
      id: item.guid || link,
      title: title,
      buyUrl: link,
      imageUrl: imageUrl,
      buyPrice: buyPrice,
      estimatedResellPrice: resellPrice,
      margin: margin,
      marginPercent: marginPercent,
      sellPlatform: 'eBay',
      sellUrl: ebaySearchUrl,
      analysis: analysis,
    });
  }

    } catch (error) {
      console.error(`Error parsing feed ${url}:`, error);
    }
  }

  // Sort by highest absolute margin first
  products.sort((a, b) => b.margin - a.margin);

  // Return top 20
  return products.slice(0, 20);
}
