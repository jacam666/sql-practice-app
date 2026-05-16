import Link from "next/link";
import { Header } from "@/components/header";
import { ProgressCards, TopicGrid } from "@/components/progress-cards";
import { DatabaseCards } from "@/components/database-cards";
import { DifficultyCards } from "@/components/difficulty-cards";
import { Button } from "@/components/ui/button";
import { ChevronRight, Code2 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Master SQL for Interviews
              </h1>
              <p className="mt-2 text-muted-foreground">
                Practice with real-world databases and ace your data analyst
                interviews.
              </p>
            </div>
            <Link href="/practice" className="shrink-0">
              <Button size="lg" className="w-full sm:w-auto">
                <Code2 className="mr-2 h-5 w-5" />
                Start Practicing
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Progress Overview */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">Your Progress</h2>
          <ProgressCards />
        </section>

        {/* Topics Grid */}
        <section className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">SQL Topics</h2>
            <Link href="/practice">
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <TopicGrid />
        </section>

        {/* Difficulty Levels */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">Difficulty Levels</h2>
          <DifficultyCards />
        </section>

        {/* Practice Databases */}
        <section className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Practice Databases</h2>
            <Link href="/databases">
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <DatabaseCards />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Built for aspiring data analysts and engineers.</p>
          <p className="mt-1">
            Practice SQL queries, master interview patterns, land your dream
            job.
          </p>
        </div>
      </footer>
    </div>
  );
}
