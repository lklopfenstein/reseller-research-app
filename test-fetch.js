const https = require('https');

const options = {
  hostname: 'www.ebay.com',
  port: 443,
  path: '/sch/i.html?_nkw=Apple%20AirPods%20Pro&LH_Sold=1&LH_Complete=1',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Ch-Ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"macOS"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
  }
};

const req = https.request(options, (res) => {
  console.log('statusCode:', res.statusCode);
  
  let data = '';
  res.on('data', (d) => {
    data += d;
  });
  
  res.on('end', () => {
    if (data.includes('s-item__price')) {
      console.log('Success! Found price elements.');
    } else {
      console.log('Failed. Output:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error(e);
});
req.end();
