import { load as loadHTML } from 'cheerio';
import { CONFIG, USE_BROWSER } from './config.js';

export async function fetchHtml(url = CONFIG.TARGET_URL) {
  try {
    const u = new URL(url);
    const fetchUrl = `${u.origin}${u.pathname}`;

    const res = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'user-agent': CONFIG.USER_AGENT,
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7',
        referer: 'https://www.kopahund.se/',
      },
    });

    if (!res.ok) {
      console.warn(`[static-fetch] HTTP ${res.status} for ${fetchUrl}`);
      return null;
    }

    return await res.text();
  } catch (err) {
    console.warn('[static-fetch] failed:', err?.message || err);
    return null;
  }
}

async function fetchRenderedHtml(url = CONFIG.TARGET_URL) {
  if (!USE_BROWSER) return null;
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
      return null;
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

export function parseAdverts(html) {
  if (!html) return [];
  const $ = loadHTML(html);
  const items = [];

  $('div.card.dog-card').each((_, el) => {
    const root = $(el);

    const title =
      root.find('h3.card-title').first().text().trim() ||
      root.find('.dog-card__title').text().trim() ||
      root.find('h2, h3, .title').first().text().trim() ||
      (root.find('img.dog-card-image').attr('alt') || '').trim() ||
      'Dog advert';

    const hrefRaw =
      root.find('a.dog-card-link').attr('href') ||
      root.find('a').first().attr('href') ||
      '#';
    const href = new URL(hrefRaw, 'https://www.kopahund.se').toString();

    let location = '';
    root.find('.card-body .d-flex').each((_, row) => {
      const hasLocIcon = $(row).find('[style*="location.svg"]').length > 0;
      if (hasLocIcon) {
        const text = $(row).find('span').last().text().trim();
        if (text) location = text;
      }
    });

    const preview = root
      .find('.card-body')
      .text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);

    items.push({ title, href, location, preview });
  });

  return items;
}

export async function getAdverts() {
  let items = [];

  const html = await fetchHtml();
  if (html) {
    try {
      items = parseAdverts(html);
    } catch (err) {
      console.warn('[parse-static] failed:', err?.message || err);
    }
  }

  // Only render with a headless browser when explicitly requested
  if (USE_BROWSER) {
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
