import Link from "next/link";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Database, Table2 } from "lucide-react";
import { databases } from "@/lib/data";

const databaseIcons: Record<string, string> = {
  city: "🌍",
  store: "🛒",
  gym: "💪",
  anime: "🎬",
};

export default function DatabasesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Practice Databases</h1>
          <p className="mt-2 text-muted-foreground">
            Explore different datasets and practice SQL with real-world schemas.
          </p>
        </div>

        {/* Database Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {databases.map((db) => (
            <Card key={db.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center gap-4 bg-muted/30 pb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-background text-3xl shadow-sm">
                  {databaseIcons[db.id] || "📊"}
                </div>
                <div>
                  <CardTitle className="text-xl">{db.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {db.tables.length} tables
                  </p>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  {db.description}
                </p>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Tables
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {db.tables.map((table) => (
                      <Badge
                        key={table.name}
                        variant="secondary"
                        className="gap-1 font-mono text-xs"
                      >
                        <Table2 className="h-3 w-3" />
                        {table.name}
                        <span className="text-muted-foreground">
                          ({table.columns.length})
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Link href={`/databases/${db.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Database className="mr-2 h-4 w-4" />
                      View Schema
                    </Button>
                  </Link>
                  <Link href={`/practice?database=${db.id}`} className="flex-1">
                    <Button className="w-full">
                      Practice
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
