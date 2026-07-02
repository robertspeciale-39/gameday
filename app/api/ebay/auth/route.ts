// Kicks off eBay OAuth. Visit /api/ebay/auth once after adding keys.
import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/ebay/client";

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json(
      { message: "Demo mode. Add EBAY_CLIENT_ID / EBAY_CLIENT_SECRET / EBAY_REDIRECT_URI to connect a real account." },
      { status: 400 }
    );
  }
  const base =
    process.env.EBAY_ENV === "SANDBOX"
      ? "https://auth.sandbox.ebay.com/oauth2/authorize"
      : "https://auth.ebay.com/oauth2/authorize";
  const url = new URL(base);
  url.searchParams.set("client_id", process.env.EBAY_CLIENT_ID!);
  url.searchParams.set("redirect_uri", process.env.EBAY_REDIRECT_URI!);
  url.searchParams.set("response_type", "code");
  url.searchParams.set(
    "scope",
    "https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly https://api.ebay.com/oauth/api_scope/sell.inventory.readonly"
  );
  return NextResponse.redirect(url.toString());
}
