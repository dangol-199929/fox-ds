import { NextResponse, type NextRequest } from "next/server";
import { isCustomerAccountConfigured } from "@/lib/customer-account/config";
import { safeReturnTo } from "@/lib/customer-account/pkce";
import { clearSession, readSession, refreshSession, writeSession } from "@/lib/customer-account/session";

/** Swaps an expired access token for a new one, then returns to the page. */
export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  if (!isCustomerAccountConfigured()) return NextResponse.redirect(new URL("/account", request.url));

  const session = await readSession();
  if (!session) {
    return NextResponse.redirect(new URL(`/account?signin=1&returnTo=${encodeURIComponent(returnTo)}`, request.url));
  }
  try {
    await writeSession(await refreshSession(session));
    return NextResponse.redirect(new URL(returnTo, request.url));
  } catch {
    // Refresh token expired or revoked: sign in again.
    await clearSession();
    return NextResponse.redirect(new URL(`/account?error=expired&returnTo=${encodeURIComponent(returnTo)}`, request.url));
  }
}
