const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  // Go to login first to set token
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'harsh@aurenza.in');
  await page.type('input[type="password"]', 'harsh123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  await page.goto('http://localhost:5173/orders', { waitUntil: 'networkidle0' });
  
  // click the first order
  const orders = await page.$$('.cursor-pointer.group');
  if (orders.length > 0) {
    console.log('Clicking first order...');
    await orders[0].click();
    await new Promise(r => setTimeout(r, 2000));
  } else {
    console.log('No orders found to click');
  }

  await browser.close();
})();
