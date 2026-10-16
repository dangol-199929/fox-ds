import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy/policy-page";

export const metadata: Metadata = { title: "Shipping policy" };

export default function Page() {
  return <PolicyPage kind="shippingPolicy" fallbackTitle="Shipping policy" />;
}
