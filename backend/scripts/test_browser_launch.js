const puppeteer = require('puppeteer-core');

async function test() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  const title = await page.title();
  console.log('Page Title:', title);
  await browser.close();
  console.log('SUCCESS: Chrome launched and loaded app successfully!');
}

test().catch(err => {
  console.error('PUPPETEER ERROR:', err);
  process.exit(1);
});
