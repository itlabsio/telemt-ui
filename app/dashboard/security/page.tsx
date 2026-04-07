import type { Metadata } from "next";
import SecurityClient from "./security-client";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return <SecurityClient />;
}