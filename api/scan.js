import { CONFIG, USE_BROWSER } from './config.js';
import { parseAdverts } from './parse.js';

export async function fetchRenderedHtml(url = CONFIG.TARGET_URL) {
  if (process.env.VERCEL) {
    try {
      const { default: chromium } = await import('@sparticuz/chromium');
      const { default: puppeteer } = await import('puppeteer-core');

      const executablePath = await chromium.executablePath();
      if (!executablePath) throw new Error('Chromium executablePath not found');

      const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });
      try {
        const page = await browser.newPage();
        await page.setExtraHTTPHeaders({ 'User-Agent': CONFIG.USER_AGENT });
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await page
          .waitForSelector('div.card.dog-card', { timeout: 20000 })
          .catch(() => {});
        return await page.content();
      } finally {
        await browser.close();
      }
    } catch (err) {
      console.warn('[headless-fallback:vercel] failed:', err?.message || err);
      return null; // Continue without crashing
    }
  }

  try {
    const { default: puppeteer } = await import('puppeteer');
    const browser = await puppeteer.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({ 'User-Agent': CONFIG.USER_AGENT });
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
      await page
        .waitForSelector('div.card.dog-card', { timeout: 20000 })
        .catch(() => {});
      return await page.content();
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.warn('[headless-fallback:local] failed:', err?.message || err);
    return null;
  }
}

export async function getAdverts() {
  let items = []; // assume initial fetch from API or cache

  if (USE_BROWSER || items.length === 0) {
    const rendered = await fetchRenderedHtml();
    if (rendered) {
      try {
        const renderedItems = parseAdverts(rendered);
        if (renderedItems.length > items.length) items = renderedItems;
      } catch (err) {
        console.warn('[parse-rendered] failed:', err?.message || err);
      }
    }
  }

  return items;
}
