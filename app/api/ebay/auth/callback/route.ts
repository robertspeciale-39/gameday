// eBay redirects here with ?code=... after the seller approves access.
import { NextRequest, NextResponse } from "next/server";
import { exchangeAuthCode } from "@/lib/ebay/client";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });
  await exchangeAuthCode(code);
  return NextResponse.redirect(new URL("/", req.url));
}
