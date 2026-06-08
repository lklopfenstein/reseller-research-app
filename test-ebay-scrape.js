const cheerio = require('cheerio');

async function testEbayScrape(query) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&LH_Sold=1&LH_Complete=1`;
  
  console.log('Fetching URL:', url);
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    console.log('HTML Start:', html.substring(0, 500));
    const $ = cheerio.load(html);
    
    const items = $('.s-item__wrapper');
    console.log(`Found ${items.length} items on the page.`);
    
    let soldCount = 0;
    let totalSoldPrice = 0;
    const soldDates = [];

    items.each((i, el) => {
      if (i === 0) return;
      
      const priceText = $(el).find('.s-item__price').text();
      const dateText = $(el).find('.s-item__title--tag').text() || $(el).find('.POSITIVE').text();
      
      if (priceText) {
        const priceMatch = priceText.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        if (priceMatch) {
          const price = parseFloat(priceMatch[1].replace(/,/g, ''));
          soldCount++;
          totalSoldPrice += price;
        }
      }
      
      if (dateText) {
         soldDates.push(dateText.replace(/Sold\s+/i, '').trim());
      }
    });

    if (soldCount > 0) {
      const avgPrice = totalSoldPrice / soldCount;
      console.log(`Average Sold Price: $${avgPrice.toFixed(2)}`);
      console.log(`Recent Sale Dates: ${soldDates.slice(0, 5).join(', ')}`);
    } else {
      console.log('No sold data found or parsing failed.');
    }

  } catch (err) {
    console.error('Error fetching eBay data:', err);
  }
}

testEbayScrape('macbook pro m1 16gb 512gb');
