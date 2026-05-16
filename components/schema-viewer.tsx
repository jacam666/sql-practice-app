import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Key, Link2 } from "lucide-react";
import type { Database, Table as TableType } from "@/lib/data";

interface SchemaViewerProps {
  database: Database;
}

export function SchemaViewer({ database }: SchemaViewerProps) {
  return (
    <div className="space-y-6">
      {database.tables.map((table) => (
        <TableSchema key={table.name} table={table} />
      ))}
    </div>
  );
}

function TableSchema({ table }: { table: TableType }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-mono text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-sm font-bold text-primary">
            T
          </span>
          {table.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Column definitions */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
            Columns
          </h4>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[200px]">Column</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[150px]">Constraints</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.columns.map((column) => (
                  <TableRow key={column.name}>
                    <TableCell className="font-mono text-sm">
                      {column.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {column.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {column.primaryKey && (
                          <Badge className="gap-1 text-xs">
                            <Key className="h-3 w-3" />
                            PK
                          </Badge>
                        )}
                        {column.foreignKey && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Link2 className="h-3 w-3" />
                            FK
                          </Badge>
                        )}
                        {column.nullable && (
                          <Badge variant="secondary" className="text-xs">
                            NULL
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Foreign key details */}
        {table.columns.some((col) => col.foreignKey) && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Foreign Keys
            </h4>
            <div className="space-y-1">
              {table.columns
                .filter((col) => col.foreignKey)
                .map((col) => (
                  <div
                    key={col.name}
                    className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm"
                  >
                    <span className="font-mono">{col.name}</span>
                    <span className="text-muted-foreground">references</span>
                    <span className="font-mono text-primary">
                      {col.foreignKey!.table}.{col.foreignKey!.column}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Sample data */}
        <Accordion type="single" collapsible>
          <AccordionItem value="sample-data" className="border-none">
            <AccordionTrigger className="py-2 text-sm font-medium text-muted-foreground hover:no-underline">
              Sample Data ({table.sampleData.length} rows)
            </AccordionTrigger>
            <AccordionContent>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {table.columns.map((col) => (
                        <TableHead key={col.name} className="font-mono text-xs">
                          {col.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {table.sampleData.map((row, idx) => (
                      <TableRow key={idx}>
                        {table.columns.map((col) => (
                          <TableCell
                            key={col.name}
                            className="font-mono text-xs"
                          >
                            {String(row[col.name] ?? "NULL")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
