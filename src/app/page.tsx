import { HomeClient } from "@/components/home-client";

export default function HomePage() {
  // Fixed demo timestamp avoids hydration mismatch from Date.now()
  const lastRefresh = "09:35 UTC";

  return <HomeClient lastRefresh={lastRefresh} />;
}
