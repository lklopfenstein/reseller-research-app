import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteerExtra.use(StealthPlugin());

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&LH_Sold=1&LH_Complete=1&LH_ItemCondition=1000&LH_BIN=1&LH_PrefLoc=1`;

  let browser = null;
  try {
    const isLocal = process.env.NODE_ENV === 'development' || !process.env.VERCEL;
    
    let executablePath = null;
    if (isLocal) {
      executablePath = process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/google-chrome';
    } else {
      executablePath = await chromium.executablePath('https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar');
    }

    const options = {
      args: isLocal ? [] : chromium.args,
      executablePath,
      headless: true,
    };

    browser = await puppeteerExtra.launch(options as any);

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const data = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.s-item__wrapper'));
      const prices: number[] = [];
      const soldDates: string[] = [];

      items.forEach((item, index) => {
        if (index === 0) return; // Skip dummy "Shop on eBay" item
        
        const priceEl = item.querySelector('.s-item__price');
        const dateEl = item.querySelector('.s-item__title--tag') || item.querySelector('.POSITIVE');
        
        if (priceEl && priceEl.textContent) {
          const match = priceEl.textContent.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
          if (match) {
            const price = parseFloat(match[1].replace(/,/g, ''));
            prices.push(price);
          }
        }
        
        if (dateEl && dateEl.textContent) {
          soldDates.push(dateEl.textContent.replace(/Sold\s+/i, '').trim());
        }
      });

      // 3x Smarter: Statistical Outlier Rejection (IQR Method)
      let finalAverage = 0;
      let validPrices = prices;
      
      if (prices.length > 3) {
        prices.sort((a, b) => a - b);
        const q1Index = Math.floor(prices.length * 0.25);
        const q3Index = Math.floor(prices.length * 0.75);
        const q1 = prices[q1Index];
        const q3 = prices[q3Index];
        const iqr = q3 - q1;
        
        // Use a strict 1.0 multiplier instead of 1.5 to aggressively prune "Parts Only" or "Accessories"
        const lowerBound = q1 - (1.0 * iqr);
        const upperBound = q3 + (1.0 * iqr);
        
        validPrices = prices.filter(p => p >= lowerBound && p <= upperBound);
      }
      
      if (validPrices.length > 0) {
        finalAverage = validPrices.reduce((a, b) => a + b, 0) / validPrices.length;
      }

      return {
        soldCount: prices.length,
        averagePrice: finalAverage, // true market average of valid items
        recentDates: soldDates.slice(0, 10),
      };
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Puppeteer scrape error:', error);
    return NextResponse.json({ error: error.message || 'Failed to scrape data' }, { status: 500 });
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}
