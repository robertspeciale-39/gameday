# Gameday Seller Desk

eBay auction dashboard + one-click Word address labels for Gameday Sports Cards.
Postage is handled by eBay Labels; this app produces the **address label only** as a
4"×6" `.docx` (open in Word, Ctrl+P).

## Demo mode (default)

With no eBay keys configured, the app runs on staged demo data automatically.
A "Demo data" badge shows in the header area so nobody mistakes it for live sales.

```bash
npm install
npm run dev      # http://localhost:3000
```

The "Generate label" buttons are fully functional in demo mode — they download real
Word documents built from the staged orders.

## Deploy (GitHub → Vercel)

1. Push this repo to GitHub.
2. In Vercel: **New Project → Import** the repo. No settings needed; it deploys in demo mode.
3. (For go-live) Add the **Vercel KV** integration to the project — it stores the eBay
   OAuth tokens and auto-populates `KV_REST_API_URL` / `KV_REST_API_TOKEN`.

## Going live with real eBay data

1. Create an account at [developer.ebay.com](https://developer.ebay.com) and request a
   **production keyset** (approval takes ~1–2 business days).
2. In the eBay developer portal, set your OAuth **redirect URI** to
   `https://YOUR-APP.vercel.app/api/ebay/auth/callback` and note the RuName.
3. In Vercel → Project → Settings → Environment Variables, fill in the values from
   `.env.example` (`EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, `EBAY_REDIRECT_URI`, and the
   return-address lines).
4. Redeploy, then visit `https://YOUR-APP.vercel.app/api/ebay/auth` once and approve
   access with the seller's eBay account. The refresh token (18-month life) is stored
   in Vercel KV; the dashboard flips from demo to live data automatically.

## How refresh works

The dashboard page revalidates against eBay every 10 minutes (`revalidate = 600`),
matching the project plan's polling cadence. If you later want a hard schedule
independent of traffic, add a Vercel Cron hitting `/` — no code changes required.

## Stack

Next.js 14 (App Router) · Tailwind · `docx` · eBay Sell APIs (OAuth, Fulfillment, Trading) · Vercel KV

## Out of scope (v1)

Postage/tracking, auto-printing, multi-seller, inventory analytics — per the project plan.
