import { getAdverts, debugScan } from '../src/scrape.js';
import { sendNotification } from '../src/email.js';

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const debug = url.searchParams.get('debug') === '1';

    if (debug) {
      const diag = await debugScan();
      return res.status(200).json({ ok: true, debug: true, diag });
    }

    const adverts = await getAdverts();
    if (adverts.length) {
      await sendNotification(adverts);
    }
    return res.status(200).json({ ok: true, count: adverts.length });
  } catch (err) {
    console.error('[api/scan] error:', err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || 'Internal Server Error' });
  }
}
