import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { SchemaViewer } from "@/components/schema-viewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Code2, Table2 } from "lucide-react";
import { getDatabase } from "@/lib/data";

interface DatabasePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}

export default async function DatabasePage({ params, searchParams }: DatabasePageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const database = getDatabase(id);

  if (!database) {
    notFound();
  }

  const fromParam = Array.isArray(resolvedSearchParams.from)
    ? resolvedSearchParams.from[0]
    : resolvedSearchParams.from;
  const practiceHref =
    fromParam && fromParam.startsWith("/practice")
      ? fromParam
      : `/practice?database=${database.id}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/databases">
            <Button variant="ghost" size="sm" className="gap-1 pl-1">
              <ChevronLeft className="h-4 w-4" />
              All Databases
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{database.name}</h1>
            <p className="mt-1 text-muted-foreground">{database.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {database.tables.map((table) => (
                <Badge key={table.name} variant="secondary" className="gap-1">
                  <Table2 className="h-3 w-3" />
                  {table.name}
                </Badge>
              ))}
            </div>
          </div>
          <Link href={practiceHref}>
            <Button className="w-full sm:w-auto">
              <Code2 className="mr-2 h-4 w-4" />
              Practice with this Database
            </Button>
          </Link>
        </div>

        {/* Schema */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">Database Schema</h2>
          <SchemaViewer database={database} />
        </section>
      </main>
    </div>
  );
}

export async function generateStaticParams() {
  const { databases } = await import("@/lib/data");
  return databases.map((db) => ({ id: db.id }));
}
