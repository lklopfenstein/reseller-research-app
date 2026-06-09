const puppeteer = require('puppeteer-core');
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

async function run() {
  const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  
  const browser = await puppeteerExtra.launch({
    executablePath,
    headless: true,
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  const url = `https://www.ebay.com/sch/i.html?_nkw=Apple+AirPods+Pro+2nd&LH_Sold=1&LH_Complete=1&LH_ItemCondition=1000&LH_BIN=1&LH_PrefLoc=1`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  
  const data = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.s-item__wrapper'));
    const results = [];
    items.forEach((item, index) => {
      if (index === 0) return;
      const priceEl = item.querySelector('.s-item__price');
      if (priceEl) results.push(priceEl.textContent);
    });
    return results;
  });
  
  await page.screenshot({ path: 'ebay-screenshot.png' });
  console.log('Prices found:', data);
  await browser.close();
}

run().catch(console.error);
