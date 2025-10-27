// Vercel Serverless Function
import { DateTime } from 'luxon';
import { getAdverts } from '../src/scrape.js';
import { sendNotification } from '../src/email.js';

export default async function handler(res) {
  try {
    const now = DateTime.now().setZone('Europe/Stockholm');

    if (!(now.minute === 0 && now.hour === 20)) {
      return res.status(200).json({
        ok: true,
        skipped: true,
        reason: 'Outside 20:00 Europe/Stockholm',
      });
    }

    const adverts = await getAdverts();
    if (adverts.length) {
      await sendNotification(adverts);
    }
    return res.status(200).json({ ok: true, count: adverts.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
