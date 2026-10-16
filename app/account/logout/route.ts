import { NextResponse, type NextRequest } from "next/server";
import { getCustomerAccountConfig, getDiscovery, isCustomerAccountConfigured } from "@/lib/customer-account/config";
import { clearSession, readSession } from "@/lib/customer-account/session";

/**
 * Signs out: clears our session cookie and ends the Shopify session.
 * POST only, from a same-site form, so a link elsewhere can't sign people out.
 */
export async function POST(request: NextRequest) {
  const home = new URL("/", request.url);
  if (!isCustomerAccountConfigured()) return NextResponse.redirect(home, 303);

  const session = await readSession();
  await clearSession();
  if (!session?.idToken) return NextResponse.redirect(home, 303);

  const config = getCustomerAccountConfig();
  const { endSessionEndpoint } = await getDiscovery();
  const url = new URL(endSessionEndpoint);
  url.search = new URLSearchParams({
    id_token_hint: session.idToken,
    post_logout_redirect_uri: config.postLogoutRedirectUri,
  }).toString();
  return NextResponse.redirect(url, 303);
}
