import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
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
  const url = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&LH_Sold=1&LH_Complete=1`;

  let browser = null;
  try {
    const exePathFn = (chromium as any).executablePath || (chromium as any).default?.executablePath;
    const executablePath = exePathFn ? await exePathFn() : null;
    
    // Fallback to local chromium if not running on Vercel
    const options = {
      args: (chromium as any).args || (chromium as any).default?.args || [],
      executablePath: executablePath || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/google-chrome'),
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

      // Calculate Median instead of Mean to ignore "wildly high" bundles
      prices.sort((a, b) => a - b);
      let medianPrice = 0;
      if (prices.length > 0) {
        const mid = Math.floor(prices.length / 2);
        medianPrice = prices.length % 2 !== 0 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
      }

      return {
        soldCount: prices.length,
        averagePrice: medianPrice, // returning median but keeping property name for frontend compatibility
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
