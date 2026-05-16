import { getDatabase } from "./databases";
import type { DatabaseName } from "./types";

export interface QueryExecutionResult {
  columns: string[];
  rows: Record<string, unknown>[];
}

type AlaSqlFn = {
  (sql: string, params?: unknown[]): unknown;
};

function toAlaSqlType(type: string): string {
  const normalized = type.toUpperCase();

  if (normalized.includes("INT") || normalized.includes("DECIMAL") || normalized.includes("NUM")) {
    return "NUMBER";
  }

  if (normalized.includes("DATE") || normalized.includes("TIME")) {
    return "STRING";
  }

  return "STRING";
}

function escapeIdentifier(name: string): string {
  return `[${name.replace(/\]/g, "]]" )}]`;
}

function normalizeRows(result: unknown): Record<string, unknown>[] {
  if (!Array.isArray(result)) return [];

  return result.map((item) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      return item as Record<string, unknown>;
    }

    return { value: item };
  });
}

function lowercaseOutsideQuotes(sql: string): string {
  let result = "";
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];

    if (char === "'" && !inDouble) {
      inSingle = !inSingle;
      result += char;
      continue;
    }

    if (char === '"' && !inSingle) {
      inDouble = !inDouble;
      result += char;
      continue;
    }

    result += inSingle || inDouble ? char : char.toLowerCase();
  }

  return result;
}

export async function executeSqlQuery(
  sql: string,
  databaseName: DatabaseName,
): Promise<QueryExecutionResult> {
  const trimmed = sql.trim();
  if (!trimmed) {
    throw new Error("Please enter a query first.");
  }

  if (!/^\s*(select|with)\b/i.test(trimmed)) {
    throw new Error("Only SELECT queries are supported in practice mode.");
  }

  const database = getDatabase(databaseName);
  if (!database) {
    throw new Error("Database schema not found for this question.");
  }

  const alaModule = await import("alasql");
  const defaultExport = (alaModule as { default?: unknown }).default;
  const alasql: AlaSqlFn = (
    typeof defaultExport === "function"
      ? defaultExport
      : (alaModule as unknown)
  ) as AlaSqlFn;
  const tempDbName = `practice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const escapedDbName = escapeIdentifier(tempDbName);

  try {
    alasql(`CREATE DATABASE ${escapedDbName}`);
    alasql(`USE ${escapedDbName}`);

    for (const table of database.tables) {
      const escapedTable = escapeIdentifier(table.name);
      const columnDefs = table.columns
        .map((col) => `${escapeIdentifier(col.name)} ${toAlaSqlType(col.type)}`)
        .join(", ");

      alasql(`CREATE TABLE ${escapedTable} (${columnDefs})`);

      if (table.sampleData.length > 0) {
        alasql(`INSERT INTO ${escapedTable} SELECT * FROM ?`, [table.sampleData]);
      }

      const lowerTableName = table.name.toLowerCase();
      if (lowerTableName !== table.name) {
        const escapedLowerTable = escapeIdentifier(lowerTableName);
        alasql(`CREATE TABLE ${escapedLowerTable} (${columnDefs})`);
        if (table.sampleData.length > 0) {
          alasql(`INSERT INTO ${escapedLowerTable} SELECT * FROM ?`, [table.sampleData]);
        }
      }
    }

    const executableSql = lowercaseOutsideQuotes(trimmed);
    const rawResult = alasql(executableSql);
    const rows = normalizeRows(rawResult);
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return { columns, rows };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid SQL query.";
    throw new Error(message.replace(/^Parse error on line.*?\n/i, ""));
  } finally {
    try {
      alasql("USE alasql");
      alasql(`DROP DATABASE ${escapedDbName}`);
    } catch {
      // Best effort cleanup.
    }
  }
}
