import { gotScraping } from 'got-scraping';

async function run() {
  try {
    const res = await gotScraping.get('https://www.ebay.com/sch/i.html?_nkw=macbook+pro&LH_Sold=1&LH_Complete=1');
    console.log('Includes price?', res.body.includes('s-item__price'));
    console.log('Body length:', res.body.length);
    if (!res.body.includes('s-item__price')) {
      console.log('Start of body:', res.body.substring(0, 300));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
