import { NextResponse, type NextRequest } from "next/server";
import { isCustomerAccountConfigured } from "@/lib/customer-account/config";
import { exchangeCode, takePendingLogin, writeSession } from "@/lib/customer-account/session";

/** Shopify sends the customer back here with an authorization code. */
export async function GET(request: NextRequest) {
  const fail = (reason: string) => NextResponse.redirect(new URL(`/account?error=${reason}`, request.url));
  if (!isCustomerAccountConfigured()) return fail("unavailable");

  const params = request.nextUrl.searchParams;
  const pending = await takePendingLogin();

  // The customer cancelled or Shopify reported an error.
  if (params.get("error")) return fail("cancelled");
  // CSRF protection: the state must match the one we issued to this browser.
  if (!pending || !params.get("state") || params.get("state") !== pending.state) return fail("expired");

  const code = params.get("code");
  if (!code) return fail("expired");

  try {
    const session = await exchangeCode(code, pending);
    await writeSession(session);
  } catch (error) {
    console.error(`[account] sign-in failed - ${error instanceof Error ? error.message : "unknown"}`);
    return fail("signin");
  }
  return NextResponse.redirect(new URL(pending.returnTo, request.url));
}
