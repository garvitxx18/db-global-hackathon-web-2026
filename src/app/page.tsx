import { HomeClient } from "@/components/home-client";

export default function HomePage() {
  // Fixed demo timestamp avoids hydration mismatch from Date.now()
  const lastRefresh = "19:05 UTC";

  return <HomeClient lastRefresh={lastRefresh} />;
}
