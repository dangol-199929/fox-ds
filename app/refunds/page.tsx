import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy/policy-page";

export const metadata: Metadata = { title: "Returns & refunds" };

export default function Page() {
  return <PolicyPage kind="refundPolicy" fallbackTitle="Returns & refunds" />;
}
