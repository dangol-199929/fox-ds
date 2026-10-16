import "server-only";
import { redirect } from "next/navigation";
import { isCustomerAccountConfigured } from "./config";
import { isExpired, readSession, type CustomerSession } from "./session";

/**
 * For account pages: returns a valid session, or redirects. An expired access
 * token is sent through /account/refresh (a Route Handler, which can update
 * the cookie) and back. Never trusts client-side state.
 */
export async function requireSession(returnTo: string): Promise<CustomerSession> {
  if (!isCustomerAccountConfigured()) redirect("/account");
  const session = await readSession();
  if (!session) redirect(`/account?signin=1&returnTo=${encodeURIComponent(returnTo)}`);
  if (isExpired(session)) redirect(`/account/refresh?returnTo=${encodeURIComponent(returnTo)}`);
  return session;
}
