import { getAdverts } from '../src/scrape.js';
import { sendNotification } from '../src/email.js';

export default async function handler(req, res) {
  try {
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
