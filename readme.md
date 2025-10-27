# 🐶 Köpahund Notifier

This project checks a dog search page on **kopahund.se**. If there are dogs available that match your filter URL, it will send you an email using **Resend**. Useful for example if you are waiting for a dog of a rare breed that might not show up often.

It can:

- Run **locally on your computer** to test
- Run **once per day** at **20:00 Stockholm time** on **Vercel.com**

---

## ✅ What you need

- Node.js version **20 or newer**
- A **Resend.com** account (free tier is enough)
- A URL from https://www.kopahund.se with filters for the dogs you want

Example URL:

```
https://www.kopahund.se/#/?breeds=526&gender=2&ages=1%2C2
```

---

## 💻 Run locally

1️⃣ Copy the example environment file:

```
cp .env.example .env
```

2️⃣ Open `.env` and fill in the values:

- `TARGET_URL` → your kopahund URL
- `RESEND_API_KEY` → from your Resend dashboard
- `NOTIFY_EMAIL` → where you want the alert mail
- `FROM_EMAIL` → use **onboarding@resend.dev** for testing
- Plus some other environment variables that you can simply copy from the example.

3️⃣ Install dependencies:

```
npm install
```

4️⃣ Test one single scan:

```
npm run run-once
```

You will see how many ads were found.
If ads exist, an email is sent.

5️⃣ Optional: Run a small local scheduler
This checks every minute and sends **only** at 20:00 Stockholm:

```
npm run schedule
```

(You can stop with CTRL+C when finished)

✅ If you receive an email, everything works!

---

## 🌍 Deploy on Vercel.com

1️⃣ Clone this project to your own **GitHub**

2️⃣ Go to **vercel.com** → **Add New Project** → import your GitHub repo

3️⃣ Add these **Environment Variables**:
| Name | Value |
|------|-------|
| `TARGET_URL` | same as `.env` |
| `RESEND_API_KEY` | from Resend.com |
| `NOTIFY_EMAIL` | your email |
| `FROM_EMAIL` | recommended: your own verified domain, but can be onboarding@resend.dev |
| `USE_BROWSER` | false (or omit) |

4️⃣ Deploy project

5️⃣ Vercel sees the file `vercel.json` and automatically creates an hourly Cron Job.

The function only sends mail **once daily** at 20:00 Stockholm.

---

## 🐕 Troubleshooting

❌ Email error about “domain not verified”
✅ Just use this for testing:

```
FROM_EMAIL="Kopahund Bot <onboarding@resend.dev>"
```

Later, verify your own domain in Resend if you want custom email address.

❌ 0 adverts found even when ads exist
✅ Add in `.env`:

```
USE_BROWSER=true
```

This uses a headless browser to load the page fully.

---

## ✨ Future improvements

- Only notify when **new** dogs appear
