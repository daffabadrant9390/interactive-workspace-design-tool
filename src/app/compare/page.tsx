import { Suspense } from "react";
import { ComparePageClient } from "@/components/compare/ComparePageClient";

export const metadata = {
  title: "Compare Setups | CiptaForge",
  description: "Compare two saved CiptaForge workspace designs side by side, items and price.",
};

export default function ComparePage() {
  return (
    <Suspense fallback={null}>
      <ComparePageClient />
    </Suspense>
  );
}
