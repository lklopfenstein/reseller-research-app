const https = require('https');
const cheerio = require('cheerio');

const query = 'site:ebay.com/itm sold "Apple AirPods Pro"';
const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const $ = cheerio.load(data);
    const prices = [];
    $('.compTitle, .compText').each((i, el) => {
      const text = $(el).text();
      const match = text.match(/\$\d+(?:,\d{3})*(?:\.\d{2})?/g);
      if (match) {
        match.forEach(m => prices.push(parseFloat(m.replace('$', '').replace(',', ''))));
      }
    });
    console.log('Found prices:', prices);
  });
});
