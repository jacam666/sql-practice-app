"use client";

import { useState, useCallback } from "react";
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
import { markQuestionComplete } from "@/lib/data/progress";

interface SQLEditorProps {
  question: SQLQuestion;
  onComplete?: (isCorrect: boolean) => void;
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

  const handleCheck = useCallback(() => {
    const checkResult = checkSqlAnswer(sql, question);
    setResult(checkResult);
    
    // Save progress
    markQuestionComplete(question.id, question.topic, checkResult.isCorrect);
    
    if (onComplete) {
      onComplete(checkResult.isCorrect);
    }
  }, [sql, question, onComplete]);

  const handleReset = useCallback(() => {
    setSql(question.starterSql);
    setResult(null);
    setShowHint(false);
    setShowSolution(false);
    setShowExpectedOutput(false);
  }, [question.starterSql]);

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
            <Button onClick={handleCheck} className="gap-2">
              <Play className="h-4 w-4" />
              Check Answer
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
              {question.expectedSql}
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
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {question.expectedColumns.map((col) => (
                        <TableHead key={col} className="font-mono text-xs">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {question.expectedRows.map((row, idx) => (
                      <TableRow key={idx}>
                        {question.expectedColumns.map((col) => (
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
