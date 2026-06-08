import Parser from 'rss-parser';
import * as cheerio from 'cheerio';

export interface Product {
  id: string;
  title: string;
  description: string;
  buyUrl: string;
  imageUrl: string;
  buyPrice: number;
  estimatedResellPrice: number;
  margin: number;
  marginPercent: number;
  sellPlatform: string;
  sellUrl: string;
  source: string;
  analysis: string;
  salesMetrics?: any;
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
    'https://dealnews.com/?rss=1',
    'https://bensbargains.com/rss/',
    'https://www.spoofee.com/rss.xml',
    'https://www.dansdeals.com/feed/',
    'https://www.reddit.com/r/buildapcsales/new/.rss',
    'https://clarkdeals.com/feed/'
  ];
  
  const products: Product[] = [];

  for (const url of urls) {
    try {
      const feed = await parser.parseURL(url);

      let i = 0;
      for (const item of feed.items) {
        i++;
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

        // Create a clean search term for eBay
        const cleanTitle = title.replace(/\$[\d.]+/g, '').replace(/[^\w\s-]/g, '').substring(0, 50).trim();
        const ebaySearchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(cleanTitle)}`;

        const analysis = `Bought for $${buyPrice.toFixed(2)}. Live market analysis pending...`;

        products.push({
          id: link || `${title}-${i}`,
          title,
          description: content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...',
          imageUrl,
          buyPrice,
          estimatedResellPrice: 0,
          margin: 0,
          marginPercent: 0,
          buyUrl: link,
          sellPlatform: 'eBay',
          sellUrl: ebaySearchUrl,
          source: url.includes('dealnews') ? 'DealNews' : 'Slickdeals',
          analysis
        });
      }
    } catch (error) {
      console.error(`Error parsing feed ${url}:`, error);
    }
  }

  // We no longer sort on the server because margins are 0.
  // We return everything and let the client sort dynamically!
  return products;
}
