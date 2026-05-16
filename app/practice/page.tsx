import { Suspense } from "react";
import { PracticeClient } from "@/components/practice-client";

function PracticeLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-full rounded-lg bg-muted" />
          <div className="h-64 w-full rounded-lg bg-muted" />
          <div className="h-48 w-full rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<PracticeLoading />}>
      <PracticeClient />
    </Suspense>
  );
}
