"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Play,
  Lightbulb,
  Eye,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Database,
} from "lucide-react";
import type { SQLQuestion } from "@/lib/data";
import { checkSqlAnswer } from "@/lib/data";
import {
  executeSqlQuery,
  type QueryExecutionResult,
} from "@/lib/data/sql-runner";
import { markQuestionComplete } from "@/lib/data/progress";

interface SQLEditorProps {
  question: SQLQuestion;
  onComplete?: (isCorrect: boolean) => void;
}

function normalizeCellValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function rowFingerprint(row: Record<string, unknown>, columns: string[]): string {
  const cells = columns.map((col) => normalizeCellValue(row[col]));
  return JSON.stringify(cells);
}

function buildFrequencyMap(values: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const value of values) {
    map.set(value, (map.get(value) || 0) + 1);
  }
  return map;
}

function haveEquivalentResultSets(
  actual: QueryExecutionResult,
  expected: QueryExecutionResult,
): boolean {
  if (actual.columns.length !== expected.columns.length) return false;
  if (actual.rows.length !== expected.rows.length) return false;

  const actualFingerprints = actual.rows.map((row) => rowFingerprint(row, actual.columns));
  const expectedFingerprints = expected.rows.map((row) => rowFingerprint(row, expected.columns));

  const actualMap = buildFrequencyMap(actualFingerprints);
  const expectedMap = buildFrequencyMap(expectedFingerprints);

  if (actualMap.size !== expectedMap.size) return false;

  for (const [key, count] of expectedMap) {
    if (actualMap.get(key) !== count) return false;
  }

  return true;
}

function splitSqlCsv(input: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

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
      else if (char === ")") depth = Math.max(0, depth - 1);

      if (char === "," && depth === 0) {
        if (current.trim()) parts.push(current.trim());
        current = "";
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function formatSqlForDisplay(sql: string): string {
  const condensed = sql.replace(/\s+/g, " ").trim();
  const match = condensed.match(/^(select\s+)([\s\S]*?)(\s+from\b[\s\S]*)$/i);

  let formatted = condensed;

  if (match) {
    const columns = splitSqlCsv(match[2]);
    if (columns.length > 1) {
      formatted = `${match[1]}\n  ${columns.join(",\n  ")}\n${match[3].trimStart()}`;
    }
  }

  return formatted
    .replace(/\s+(from)\b/gi, "\n$1")
    .replace(/\s+(left\s+join|right\s+join|inner\s+join|full\s+join|cross\s+join|join)\b/gi, "\n$1")
    .replace(/\s+(on)\b/gi, "\n  $1")
    .replace(/\s+(where)\b/gi, "\n$1")
    .replace(/\s+(group\s+by)\b/gi, "\n$1")
    .replace(/\s+(having)\b/gi, "\n$1")
    .replace(/\s+(order\s+by)\b/gi, "\n$1")
    .replace(/\s+(limit)\b/gi, "\n$1")
    .trim();
}

export function SQLEditor({ question, onComplete }: SQLEditorProps) {
  const [sql, setSql] = useState(question.starterSql);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    feedback: string;
    matchedKeywords: string[];
    missingKeywords: string[];
  } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showExpectedOutput, setShowExpectedOutput] = useState(false);
  const [queryOutput, setQueryOutput] = useState<QueryExecutionResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isRunningQuery, setIsRunningQuery] = useState(false);
  const [resolvedExpectedOutput, setResolvedExpectedOutput] =
    useState<QueryExecutionResult | null>(null);
  const [expectedOutputError, setExpectedOutputError] = useState<string | null>(null);
  const [isLoadingExpectedOutput, setIsLoadingExpectedOutput] = useState(false);

  useEffect(() => {
    setResolvedExpectedOutput(null);
    setExpectedOutputError(null);
    setIsLoadingExpectedOutput(false);
  }, [question.id]);

  useEffect(() => {
    if (!showExpectedOutput) return;

    if (question.expectedRows.length > 0) {
      setResolvedExpectedOutput({
        columns: question.expectedColumns,
        rows: question.expectedRows,
      });
      setExpectedOutputError(null);
      setIsLoadingExpectedOutput(false);
      return;
    }

    let cancelled = false;

    const loadExpectedOutput = async () => {
      setIsLoadingExpectedOutput(true);
      setExpectedOutputError(null);

      try {
        const result = await executeSqlQuery(question.expectedSql, question.database);
        if (!cancelled) {
          setResolvedExpectedOutput({
            columns: result.columns.length > 0 ? result.columns : question.expectedColumns,
            rows: result.rows,
          });
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to load expected output for this question.";
          setExpectedOutputError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingExpectedOutput(false);
        }
      }
    };

    loadExpectedOutput();

    return () => {
      cancelled = true;
    };
  }, [showExpectedOutput, question]);

  const handleCheck = useCallback(async () => {
    setIsRunningQuery(true);
    setQueryOutput(null);
    setQueryError(null);

    const checkResult = checkSqlAnswer(sql, question);
    let finalResult = checkResult;

    try {
      const output = await executeSqlQuery(sql, question.database);
      setQueryOutput(output);

      if (!checkResult.isCorrect) {
        let expectedOutput: QueryExecutionResult;

        if (question.expectedRows.length > 0) {
          expectedOutput = {
            columns: question.expectedColumns,
            rows: question.expectedRows,
          };
        } else {
          const generatedExpected = await executeSqlQuery(
            question.expectedSql,
            question.database,
          );
          expectedOutput = {
            columns:
              generatedExpected.columns.length > 0
                ? generatedExpected.columns
                : question.expectedColumns,
            rows: generatedExpected.rows,
          };
        }

        if (haveEquivalentResultSets(output, expectedOutput)) {
          finalResult = {
            ...checkResult,
            isCorrect: true,
            feedback:
              "Correct result set! Your query output matches the expected answer, even though the structure is different.",
          };
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to run query.";
      setQueryError(message);
    } finally {
      setResult(finalResult);

      // Save progress
      markQuestionComplete(question.id, question.topic, finalResult.isCorrect);

      if (onComplete) {
        onComplete(finalResult.isCorrect);
      }

      setIsRunningQuery(false);
    }
  }, [sql, question, onComplete]);

  const handleReset = useCallback(() => {
    setSql(question.starterSql);
    setResult(null);
    setShowHint(false);
    setShowSolution(false);
    setShowExpectedOutput(false);
    setQueryOutput(null);
    setQueryError(null);
    setIsRunningQuery(false);
  }, [question.starterSql]);

  const expectedColumns = resolvedExpectedOutput?.columns ?? question.expectedColumns;
  const expectedRows = resolvedExpectedOutput?.rows ?? question.expectedRows;

  return (
    <div className="space-y-4">
      {/* Question Prompt */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{question.topic}</Badge>
            <Badge
              variant={
                question.difficulty === "beginner"
                  ? "secondary"
                  : question.difficulty === "intermediate"
                  ? "default"
                  : "destructive"
              }
            >
              {question.difficulty}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Database className="h-3 w-3" />
              {question.database}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg">{question.prompt}</p>
        </CardContent>
      </Card>

      {/* SQL Editor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            Write your SQL query
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder="SELECT ..."
            className="min-h-[150px] font-mono text-sm"
            spellCheck={false}
          />

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCheck} className="gap-2" disabled={isRunningQuery}>
              <Play className="h-4 w-4" />
              {isRunningQuery ? "Running..." : "Check Answer"}
            </Button>
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowHint(!showHint)}
              className="gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              Hint
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowSolution(!showSolution)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Solution
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hint */}
      {showHint && (
        <Card className="border-chart-4/50 bg-chart-4/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-chart-4" />
              <p className="text-sm">{question.hint}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Solution */}
      {showSolution && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Expected SQL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-sm">
              {formatSqlForDisplay(question.expectedSql)}
            </pre>
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">
                Explanation
              </p>
              <p className="mt-1 text-sm">{question.explanation}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card
          className={
            result.isCorrect
              ? "border-chart-1/50 bg-chart-1/5"
              : "border-destructive/50 bg-destructive/5"
          }
        >
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              {result.isCorrect ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-chart-1" />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              )}
              <div className="space-y-2">
                <p
                  className={`font-medium ${
                    result.isCorrect ? "text-chart-1" : "text-destructive"
                  }`}
                >
                  {result.isCorrect ? "Correct!" : "Not Quite Right"}
                </p>
                <p className="text-sm">{result.feedback}</p>

                {result.matchedKeywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      Matched:
                    </span>
                    {result.matchedKeywords.map((kw) => (
                      <Badge
                        key={kw}
                        variant="secondary"
                        className="text-xs text-chart-1"
                      >
                        {kw}
                      </Badge>
                    ))}
                  </div>
                )}

                {result.missingKeywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      Missing:
                    </span>
                    {result.missingKeywords.map((kw) => (
                      <Badge
                        key={kw}
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
                        {kw}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Your Query Output */}
      {(queryOutput || queryError || isRunningQuery) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Your Query Output</CardTitle>
          </CardHeader>
          <CardContent>
            {isRunningQuery && (
              <p className="text-sm text-muted-foreground">Running query...</p>
            )}

            {!isRunningQuery && queryError && (
              <p className="text-sm text-destructive">{queryError}</p>
            )}

            {!isRunningQuery && !queryError && queryOutput && (
              <>
                {queryOutput.rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Query ran successfully but returned 0 rows.</p>
                ) : (
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          {queryOutput.columns.map((col) => (
                            <TableHead key={col} className="font-mono text-xs">
                              {col}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {queryOutput.rows.map((row, idx) => (
                          <TableRow key={idx}>
                            {queryOutput.columns.map((col) => (
                              <TableCell key={col} className="font-mono text-xs">
                                {String(row[col] ?? "NULL")}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Expected Output */}
      <Collapsible open={showExpectedOutput} onOpenChange={setShowExpectedOutput}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span>Expected Output</span>
            {showExpectedOutput ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent className="pt-4">
              {isLoadingExpectedOutput && (
                <p className="mb-3 text-sm text-muted-foreground">Loading expected output...</p>
              )}

              {!isLoadingExpectedOutput && expectedOutputError && (
                <p className="mb-3 text-sm text-destructive">{expectedOutputError}</p>
              )}

              {!isLoadingExpectedOutput && !expectedOutputError && expectedRows.length === 0 && (
                <p className="mb-3 text-sm text-muted-foreground">
                  No expected rows are available for this question yet.
                </p>
              )}

              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {expectedColumns.map((col) => (
                        <TableHead key={col} className="font-mono text-xs">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expectedRows.map((row, idx) => (
                      <TableRow key={idx}>
                        {expectedColumns.map((col) => (
                          <TableCell key={col} className="font-mono text-xs">
                            {String(row[col] ?? "NULL")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
