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

function splitSelectExpressions(selectContent: string): string[] {
  const expressions: string[] = [];
  let current = "";
  let depth = 0;
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < selectContent.length; i++) {
    const char = selectContent[i];

    if (char === "'" && !inDouble) {
      inSingle = !inSingle;
      current += char;
      continue;
    }

    if (char === '"' && !inSingle) {
      inDouble = !inDouble;
      current += char;
      continue;
    }

    if (!inSingle && !inDouble) {
      if (char === "(") depth++;
      if (char === ")") depth = Math.max(0, depth - 1);

      if (char === "," && depth === 0) {
        if (current.trim()) expressions.push(current.trim());
        current = "";
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) expressions.push(current.trim());
  return expressions;
}

function hasExplicitAlias(expr: string): boolean {
  if (/\bas\s+[a-z_][a-z0-9_]*$/i.test(expr.trim())) return true;
  // Lightweight check for implicit alias: "expr alias"
  const tokens = expr.trim().split(/\s+/);
  if (tokens.length < 2) return false;
  const last = tokens[tokens.length - 1];
  const secondLast = tokens[tokens.length - 2];
  return /^[a-z_][a-z0-9_]*$/i.test(last) && !/\.|\)|\(/.test(secondLast);
}

function normalizeSelectOutputName(expr: string): string | null {
  const trimmed = expr.trim();

  const asAlias = trimmed.match(/\bas\s+([a-z_][a-z0-9_]*)$/i);
  if (asAlias) return asAlias[1].toLowerCase();

  const tokens = trimmed.split(/\s+/);
  if (tokens.length >= 2) {
    const last = tokens[tokens.length - 1];
    const secondLast = tokens[tokens.length - 2];
    if (/^[a-z_][a-z0-9_]*$/i.test(last) && !/\.|\)|\(/.test(secondLast)) {
      return last.toLowerCase();
    }
  }

  const qualified = trimmed.match(/^([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)$/i);
  if (qualified) return qualified[2].toLowerCase();

  const simple = trimmed.match(/^([a-z_][a-z0-9_]*)$/i);
  if (simple) return simple[1].toLowerCase();

  return null;
}

function autoAliasDuplicateSelectColumns(sql: string): string {
  const match = sql.match(/^(\s*select\s+)([\s\S]*?)(\s+from\b[\s\S]*)$/i);
  if (!match) return sql;

  const selectPrefix = match[1];
  const selectContent = match[2];
  const fromAndAfter = match[3];

  // Keep malformed trailing comma intact so execution still throws a helpful syntax error.
  if (/\,\s*$/.test(selectContent)) {
    return sql;
  }

  const expressions = splitSelectExpressions(selectContent);
  if (expressions.length === 0) return sql;

  const counts = new Map<string, number>();
  const rewritten = expressions.map((expr) => {
    if (hasExplicitAlias(expr)) {
      const out = normalizeSelectOutputName(expr);
      if (out) counts.set(out, (counts.get(out) || 0) + 1);
      return expr;
    }

    const qualified = expr.match(/^([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)$/i);
    const outputName = normalizeSelectOutputName(expr);

    if (!qualified || !outputName) {
      return expr;
    }

    const seen = counts.get(outputName) || 0;
    counts.set(outputName, seen + 1);

    if (seen === 0) {
      return expr;
    }

    const aliasName = `${qualified[1]}_${qualified[2]}`;
    return `${expr} AS ${aliasName}`;
  });

  return `${selectPrefix}${rewritten.join(", ")}${fromAndAfter}`;
}

function formatSqlExecutionError(sql: string, error: unknown): string {
  const message = error instanceof Error ? error.message : "Invalid SQL query.";
  const compact = message.replace(/\s+/g, " ").trim();

  // Common typo: trailing comma before FROM in SELECT list.
  if (/select[\s\S]*,\s*from/i.test(sql)) {
    return "SQL syntax error: remove the extra comma before FROM in your SELECT list.";
  }

  // AlaSQL parser dump: ... got 'FROM'
  const gotMatch = compact.match(/got\s+'([^']+)'/i);
  if (gotMatch) {
    return `SQL syntax error near ${gotMatch[1]}. Check for missing or extra commas/keywords.`;
  }

  if (/parse error/i.test(compact) || /syntax error/i.test(compact)) {
    return "SQL syntax error. Check commas, keywords, and clause order.";
  }

  return compact;
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

    const aliasSafeSql = autoAliasDuplicateSelectColumns(trimmed);
    const executableSql = lowercaseOutsideQuotes(aliasSafeSql);
    const rawResult = alasql(executableSql);
    const rows = normalizeRows(rawResult);
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return { columns, rows };
  } catch (error) {
    throw new Error(formatSqlExecutionError(trimmed, error));
  } finally {
    try {
      alasql("USE alasql");
      alasql(`DROP DATABASE ${escapedDbName}`);
    } catch {
      // Best effort cleanup.
    }
  }
}
