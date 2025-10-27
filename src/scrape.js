import { load as loadHTML } from 'cheerio';
import { request } from 'undici';
import { CONFIG } from './config.js';

const USE_BROWSER =
  String(process.env.USE_BROWSER || '').toLowerCase() === 'true';

async function fetchRenderedHtml(url = CONFIG.TARGET_URL) {
  //dynamically import to avoid bundling in envs that dont need it
  if (process.env.VERCEL) {
    const { default: chromium } = await import('@sparticuz/chromium');
    const { default: puppeteer } = await import('puppeteer-core');
    const executablePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true,
    });
    try {
      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({ 'User-Agent': CONFIG.USER_AGENT });
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
      //wait for at least one card to appear.
      await page.waitForSelector('div.card.dog-card', { timeout: 20000 });
      return await page.content();
    } finally {
      await browser.close();
    }
  }
  //local: use puppeteer
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
}

export async function fetchHtml(url = CONFIG.TARGET_URL) {
  const res = await request(url, {
    method: 'GET',
    headers: {
      'user-agent': CONFIG.USER_AGENT,
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  if (res.statusCode >= 400) {
    throw new Error(`Failed to fetch ${url} — HTTP ${res.statusCode}`);
  }
  return await res.body.text();
}

//look for adverts wrapped in <div class="card dog-card"> … </div>
export function parseAdverts(html) {
  const $ = loadHTML(html);
  const items = [];

  $('div.card.dog-card').each((_, el) => {
    const root = $(el);

    //title can appear in multiple places; prefer the visible card title
    const title =
      root.find('h3.card-title').first().text().trim() ||
      root.find('.dog-card__title').text().trim() ||
      root.find('h2, h3, .title').first().text().trim() ||
      (root.find('img.dog-card-image').attr('alt') || '').trim() ||
      'Dog advert';

    //link is on the green arrow button with class dog-card-link
    const hrefRaw =
      root.find('a.dog-card-link').attr('href') ||
      root.find('a').first().attr('href') ||
      '#';
    const href = new URL(hrefRaw, 'https://www.kopahund.se').toString();

    //location row is the one with an icon which contains 'location.svg'
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
  const html = await fetchHtml();
  let items = parseAdverts(html);

  if (USE_BROWSER || items.length === 0) {
    try {
      const rendered = await fetchRenderedHtml();
      const renderedItems = parseAdverts(rendered);
      if (renderedItems.length > items.length) items = renderedItems;
    } catch (err) {
      console.warn('[headless-fallback] failed:', err.message);
    }
  }

  return items;
}
