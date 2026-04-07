import type { Metadata } from "next";
import StatsClient from "./stats-client";

export const metadata: Metadata = { title: "Statistics" };

export default function StatsPage() {
  return <StatsClient />;
}