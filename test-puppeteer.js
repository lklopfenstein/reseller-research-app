const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

async function testScrape(query) {
  const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1`;
  console.log(`Fetching: ${url}`);
  
  const executablePath = await chromium.executablePath() || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/google-chrome');
  
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: true
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const itemsData = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.s-item__wrapper'));
    const results = [];
    items.forEach((item, index) => {
      if (index === 0) return; // Skip dummy "Shop on eBay" item
      
      const titleEl = item.querySelector('.s-item__title');
      const priceEl = item.querySelector('.s-item__price');
      
      const title = titleEl ? titleEl.textContent : '';
      const rawPrice = priceEl ? priceEl.textContent : '';
      
      results.push({ title, rawPrice });
    });
    return results;
  });

  console.log('--- Scraped Items ---');
  itemsData.slice(0, 5).forEach((item, i) => {
    console.log(`[${i+1}] Title: ${item.title}`);
    console.log(`    Raw Price: ${item.rawPrice}`);
  });

  await browser.close();
}

testScrape('Apple AirPods Pro 2nd Gen');
