import { redirect } from "next/navigation";

// Root path redirects to the dashboard overview.
export default function RootPage() {
  redirect("/dashboard");
}
