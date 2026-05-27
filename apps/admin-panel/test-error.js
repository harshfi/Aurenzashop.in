const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  // Note: we need to bypass login or maybe we are already logged in via localStorage?
  // Let's just try to go to the page and see what happens.
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
