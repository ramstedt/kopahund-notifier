import { getAdverts } from './scrape.js';
import { sendNotification } from './email.js';

async function main() {
  const adverts = await getAdverts();
  console.log(`Found ${adverts.length} advert(s).`);
  if (adverts.length) {
    await sendNotification(adverts);
    console.log('Notification sent.');
  } else {
    console.log('No adverts found. No email sent.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
