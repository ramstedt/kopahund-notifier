import cron from 'node-cron';
import { DateTime } from 'luxon';
import { getAdverts } from './scrape.js';
import { sendNotification } from './email.js';

async function runIfNeeded() {
  const now = DateTime.now().setZone('Europe/Stockholm');
  if (now.hour === 20) {
    console.log(`[${now.toISO()}] Running daily scan...`);
    const adverts = await getAdverts();
    console.log(`Found ${adverts.length} advert(s).`);
    if (adverts.length) {
      await sendNotification(adverts);
      console.log('Notification sent.');
    } else {
      console.log('No adverts found. No email sent.');
    }
  } else {
    console.log(`[${now.toISO()}] Not 20:00 Stockholm; skipping.`);
  }
}

console.log(
  'Local scheduler started. Will check every minute and run at 20:00 Europe/Stockholm.'
);
cron.schedule('* * * * *', runIfNeeded, { timezone: 'Europe/Stockholm' });
