import { Resend } from 'resend';
import { CONFIG } from './config.js';

const resend = new Resend(CONFIG.RESEND_API_KEY);

export async function sendNotification(adverts) {
  if (!adverts || adverts.length === 0) return { skipped: true };

  const subject = `🐶 Found ${adverts.length} dog advert(s) on kopahund.se`;

  const listHtml = adverts
    .map(
      (a) => `
        <li>
          <a href="${
            a.href
          }" target="_blank" rel="noopener noreferrer">${escapeHtml(
            a.title
          )}</a>
          ${a.location ? ` – <em>${escapeHtml(a.location)}</em>` : ''}
        </li>`
    )
    .join('\n');

  const html = `
    <div>
      <p>Hi! Your daily scan found <strong>${
        adverts.length
      }</strong> advert(s):</p>
      <ul>${listHtml}</ul>
      <p style="color:#666">URL scanned: ${escapeHtml(
        process.env.TARGET_URL
      )}</p>
    </div>`;

  const text = [
    `Hi! Your daily scan found ${adverts.length} advert(s):`,
    ...adverts.map(
      (a) => `- ${a.title} ${a.location ? `(${a.location})` : ''} => ${a.href}`
    ),
    `\nURL scanned: ${process.env.TARGET_URL}`,
  ].join('\n');

  const { data, error } = await resend.emails.send({
    from: CONFIG.FROM_EMAIL,
    to: CONFIG.NOTIFY_EMAIL,
    subject,
    html,
    text,
  });

  if (error) throw error;
  return data;
}

function escapeHtml(s = '') {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
