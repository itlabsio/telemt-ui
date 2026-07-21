import type { Metadata } from "next";
import ConfigClient from "./config-client";

export const metadata: Metadata = { title: "Config" };

export default function ConfigPage() {
  return <ConfigClient />;
}
