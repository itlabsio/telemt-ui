import type { Metadata } from "next";
import RuntimeClient from "./runtime-client";

export const metadata: Metadata = { title: "Runtime" };

export default function RuntimePage() {
  return <RuntimeClient />;
}