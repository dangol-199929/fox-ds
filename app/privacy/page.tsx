import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy/policy-page";

export const metadata: Metadata = { title: "Privacy policy" };

export default function Page() {
  return <PolicyPage kind="privacyPolicy" fallbackTitle="Privacy policy" />;
}
