import { NextResponse, type NextRequest } from "next/server";
import { getCustomerAccountConfig, getDiscovery, isCustomerAccountConfigured, SCOPES } from "@/lib/customer-account/config";
import { codeChallenge, randomToken, safeReturnTo } from "@/lib/customer-account/pkce";
import { writePendingLogin } from "@/lib/customer-account/session";

/** Starts sign-in: sends the customer to Shopify's one-time-code login page. */
export async function GET(request: NextRequest) {
  if (!isCustomerAccountConfigured()) {
    return NextResponse.redirect(new URL("/account?error=unavailable", request.url));
  }
  const config = getCustomerAccountConfig();
  const { authorizationEndpoint } = await getDiscovery();

  const pending = {
    state: randomToken(),
    nonce: randomToken(),
    verifier: randomToken(48),
    returnTo: safeReturnTo(request.nextUrl.searchParams.get("returnTo")),
  };
  await writePendingLogin(pending, config);

  const url = new URL(authorizationEndpoint);
  url.search = new URLSearchParams({
    scope: SCOPES,
    client_id: config.clientId,
    response_type: "code",
    redirect_uri: config.redirectUri,
    state: pending.state,
    nonce: pending.nonce,
    code_challenge: codeChallenge(pending.verifier),
    code_challenge_method: "S256",
    locale: "en",
    region_country: "AU",
  }).toString();

  return NextResponse.redirect(url);
}
