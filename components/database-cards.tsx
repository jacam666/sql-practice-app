import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Database, Table2 } from "lucide-react";
import { databases, type Database as DatabaseType } from "@/lib/data";

const databaseIcons: Record<string, string> = {
  city: "🌍",
  store: "🛒",
  gym: "💪",
  anime: "🎬",
};

export function DatabaseCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {databases.map((db) => (
        <DatabaseCard key={db.id} database={db} />
      ))}
    </div>
  );
}

function DatabaseCard({ database }: { database: DatabaseType }) {
  return (
    <Card className="group overflow-hidden transition-all hover:border-primary hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="flex h-24 w-full items-center justify-center bg-primary/5 text-4xl sm:h-auto sm:w-24">
            {databaseIcons[database.id] || "📊"}
          </div>
          <div className="flex flex-1 flex-col justify-between p-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold group-hover:text-primary">
                  {database.name}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {database.tables.length} tables
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {database.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {database.tables.slice(0, 3).map((table) => (
                  <Badge
                    key={table.name}
                    variant="secondary"
                    className="text-xs"
                  >
                    <Table2 className="mr-1 h-3 w-3" />
                    {table.name}
                  </Badge>
                ))}
                {database.tables.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{database.tables.length - 3}
                  </Badge>
                )}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Link href={`/databases/${database.id}`}>
                <Button variant="outline" size="sm">
                  <Database className="mr-1 h-3 w-3" />
                  View Schema
                </Button>
              </Link>
              <Link href={`/practice?database=${database.id}`}>
                <Button size="sm">
                  Practice
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
