const puppeteer = require('puppeteer');

let browser;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    browser.on('disconnected', () => {
      browser = null;
    });
  }
  return browser;
}

async function generatePdfBuffer(html, retries = 3) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const instance = await getBrowser();
      const page = await instance.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true });
      await page.close();
      return pdf;
    } catch (error) {
      attempt += 1;
      if (attempt >= retries) {
        throw error;
      }
    }
  }
  throw new Error('Unable to generate PDF');
}

module.exports = {
  generatePdfBuffer
};
