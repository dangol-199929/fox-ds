import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy/policy-page";

export const metadata: Metadata = { alternates: { canonical: "/terms" }, title: "Terms of service" };

export default function Page() {
  return <PolicyPage kind="termsOfService" fallbackTitle="Terms of service" />;
}
