// Real eBay Sell API client. Dormant until EBAY_CLIENT_ID is set.
// Docs: https://developer.ebay.com/api-docs/sell/fulfillment/resources/order/methods/getOrders

import { ActiveAuction, ClosedOrder } from "@/lib/types";

const BASE = () =>
  process.env.EBAY_ENV === "SANDBOX"
    ? "https://api.sandbox.ebay.com"
    : "https://api.ebay.com";

const AUTH_BASE = () =>
  process.env.EBAY_ENV === "SANDBOX"
    ? "https://api.sandbox.ebay.com/identity/v1/oauth2/token"
    : "https://api.ebay.com/identity/v1/oauth2/token";

export function isDemoMode(): boolean {
  return !process.env.EBAY_CLIENT_ID;
}

function basicAuth(): string {
  return Buffer.from(
    `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
  ).toString("base64");
}

// ── Token storage (Vercel KV) ────────────────────────────────────
const REFRESH_KEY = "ebay:refresh_token";
const ACCESS_KEY = "ebay:access_token";

async function kv() {
  const { kv } = await import("@vercel/kv");
  return kv;
}

export async function storeRefreshToken(token: string) {
  await (await kv()).set(REFRESH_KEY, token);
}

async function getAccessToken(): Promise<string> {
  const store = await kv();
  const cached = await store.get<string>(ACCESS_KEY);
  if (cached) return cached;

  const refreshToken = await store.get<string>(REFRESH_KEY);
  if (!refreshToken) throw new Error("Not connected to eBay. Visit /api/ebay/auth to authorize.");

  const res = await fetch(AUTH_BASE(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth()}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: "https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly",
    }),
  });
  if (!res.ok) throw new Error(`eBay token refresh failed: ${res.status}`);
  const data = await res.json();
  // Cache with a safety margin before expiry
  await store.set(ACCESS_KEY, data.access_token, { ex: data.expires_in - 120 });
  return data.access_token;
}

// Exchange the one-time authorization code (OAuth callback) for tokens.
export async function exchangeAuthCode(code: string) {
  const res = await fetch(AUTH_BASE(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth()}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.EBAY_REDIRECT_URI ?? "",
    }),
  });
  if (!res.ok) throw new Error(`eBay code exchange failed: ${res.status}`);
  const data = await res.json();
  await storeRefreshToken(data.refresh_token);
}

// ── Data fetchers ────────────────────────────────────────────────
export async function fetchClosedOrders(): Promise<ClosedOrder[]> {
  const token = await getAccessToken();
  const res = await fetch(
    `${BASE()}/sell/fulfillment/v1/order?filter=orderfulfillmentstatus:%7BNOT_STARTED%7CIN_PROGRESS%7D&limit=50`,
    { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 0 } }
  );
  if (!res.ok) throw new Error(`getOrders failed: ${res.status}`);
  const data = await res.json();

  return (data.orders ?? []).map((o: any): ClosedOrder => {
    const li = o.lineItems?.[0] ?? {};
    const ship = o.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo ?? {};
    const addr = ship.contactAddress ?? {};
    return {
      orderId: o.orderId,
      buyerUsername: o.buyer?.username ?? "",
      itemTitle: li.title ?? "",
      salePrice: Number(o.pricingSummary?.total?.value ?? 0),
      paid: o.orderPaymentStatus === "PAID",
      shipByDate: li.lineItemFulfillmentInstructions?.shipByDate ?? o.creationDate,
      soldDate: o.creationDate,
      address: {
        name: ship.fullName ?? "",
        line1: addr.addressLine1 ?? "",
        line2: addr.addressLine2 || undefined,
        city: addr.city ?? "",
        state: addr.stateOrProvince ?? "",
        postalCode: addr.postalCode ?? "",
        country: addr.countryCode ?? "US",
      },
    };
  });
}

export async function fetchActiveAuctions(): Promise<ActiveAuction[]> {
  // Trading API GetMyeBaySelling (XML). Kept minimal for v1.
  const token = await getAccessToken();
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <ActiveList><Include>true</Include><Pagination><EntriesPerPage>50</EntriesPerPage><PageNumber>1</PageNumber></Pagination></ActiveList>
</GetMyeBaySellingRequest>`;

  const res = await fetch(`${BASE()}/ws/api.dll`, {
    method: "POST",
    headers: {
      "X-EBAY-API-SITEID": "0",
      "X-EBAY-API-COMPATIBILITY-LEVEL": "1193",
      "X-EBAY-API-CALL-NAME": "GetMyeBaySelling",
      "X-EBAY-API-IAF-TOKEN": token,
      "Content-Type": "text/xml",
    },
    body: xml,
  });
  if (!res.ok) throw new Error(`GetMyeBaySelling failed: ${res.status}`);
  const text = await res.text();

  // Lightweight XML extraction — swap for a parser if listings get complex.
  const items: ActiveAuction[] = [];
  const itemBlocks = text.match(/<Item>[\s\S]*?<\/Item>/g) ?? [];
  for (const block of itemBlocks) {
    const grab = (tag: string) =>
      block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1] ?? "";
    items.push({
      itemId: grab("ItemID"),
      title: grab("Title"),
      currentBid: Number(grab("CurrentPrice") || 0),
      bidCount: Number(grab("BidCount") || 0),
      endTime: grab("EndTime"),
      watchers: Number(grab("WatchCount") || 0),
    });
  }
  return items;
}
