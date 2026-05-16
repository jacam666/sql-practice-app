"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { SchemaViewer } from "@/components/schema-viewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ChevronLeft,
  ChevronRight,
  Database,
  Filter,
  Table2,
  CheckCircle2,
} from "lucide-react";
import {
  questions,
  databases,
  getDatabase,
  getProgress,
  type SQLQuestion,
  type Topic,
  type Difficulty,
  type DatabaseName,
} from "@/lib/data";

const SQLEditor = dynamic(
  () => import("@/components/sql-editor").then((mod) => mod.SQLEditor),
  { ssr: false },
);

const topics: Topic[] = [
  "SELECT",
  "WHERE",
  "ORDER BY",
  "GROUP BY",
  "HAVING",
  "JOINs",
  "subqueries",
  "window functions",
];

const difficulties: Difficulty[] = ["beginner", "intermediate", "interview"];

export function PracticeClient() {
  const searchParams = useSearchParams();
  
  // Get initial filters from URL
  const initialDatabase = searchParams.get("database") as DatabaseName | null;
  const initialTopic = searchParams.get("topic") as Topic | null;
  const initialDifficulty = searchParams.get("difficulty") as Difficulty | null;

  const [selectedDatabase, setSelectedDatabase] = useState<string>(
    initialDatabase || "all"
  );
  const [selectedTopic, setSelectedTopic] = useState<string>(
    initialTopic || "all"
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>(
    initialDifficulty || "all"
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [completedInSession, setCompletedInSession] = useState<Set<string>>(new Set());
  const [completedQuestions, setCompletedQuestions] = useState<string[]>([]);

  useEffect(() => {
    const progress = getProgress();
    setCompletedQuestions(progress.completedQuestions);
  }, []);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedDatabase !== "all" && q.database !== selectedDatabase)
        return false;
      if (selectedTopic !== "all" && q.topic !== selectedTopic) return false;
      if (selectedDifficulty !== "all" && q.difficulty !== selectedDifficulty)
        return false;
      return true;
    });
  }, [selectedDatabase, selectedTopic, selectedDifficulty]);

  const currentQuestion = filteredQuestions[currentQuestionIndex];
  const currentDatabase = currentQuestion
    ? getDatabase(currentQuestion.database)
    : null;

  const handleNext = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuestionComplete = (isCorrect: boolean) => {
    if (currentQuestion && isCorrect) {
      setCompletedInSession((prev) => new Set([...prev, currentQuestion.id]));
      setCompletedQuestions((prev) => 
        prev.includes(currentQuestion.id) ? prev : [...prev, currentQuestion.id]
      );
    }
  };

  // Reset index when filters change
  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [selectedDatabase, selectedTopic, selectedDifficulty]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Database" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Databases</SelectItem>
              {databases.map((db) => (
                <SelectItem key={db.id} value={db.id}>
                  {db.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {topics.map((topic) => (
                <SelectItem key={topic} value={topic}>
                  {topic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedDifficulty}
            onValueChange={setSelectedDifficulty}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {difficulties.map((diff) => (
                <SelectItem key={diff} value={diff}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge variant="secondary" className="ml-auto">
            {filteredQuestions.length} questions
          </Badge>
        </div>

        {filteredQuestions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No questions match your filters. Try adjusting them.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSelectedDatabase("all");
                  setSelectedTopic("all");
                  setSelectedDifficulty("all");
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
            {/* Main Content */}
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Question {currentQuestionIndex + 1} of{" "}
                    {filteredQuestions.length}
                  </span>
                  {currentQuestion &&
                    (completedQuestions.includes(currentQuestion.id) ||
                      completedInSession.has(currentQuestion.id)) && (
                      <CheckCircle2 className="h-4 w-4 text-chart-1" />
                    )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  disabled={
                    currentQuestionIndex === filteredQuestions.length - 1
                  }
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              {/* SQL Editor */}
              {currentQuestion && (
                <SQLEditor
                  key={currentQuestion.id}
                  question={currentQuestion}
                  onComplete={handleQuestionComplete}
                />
              )}
            </div>

            {/* Sidebar - Desktop */}
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                {currentDatabase && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Database className="h-4 w-4" />
                        {currentDatabase.name} Schema
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[calc(100vh-200px)] overflow-y-auto">
                      <Tabs defaultValue="tables">
                        <TabsList className="w-full">
                          <TabsTrigger value="tables" className="flex-1">
                            Tables
                          </TabsTrigger>
                          <TabsTrigger value="questions" className="flex-1">
                            Questions
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="tables" className="mt-3">
                          <div className="space-y-3">
                            {currentDatabase.tables.map((table) => (
                              <div
                                key={table.name}
                                className="rounded-md border p-3"
                              >
                                <div className="flex items-center gap-2 font-mono text-sm font-medium">
                                  <Table2 className="h-3 w-3 text-primary" />
                                  {table.name}
                                </div>
                                <div className="mt-2 space-y-1">
                                  {table.columns.map((col) => (
                                    <div
                                      key={col.name}
                                      className="flex items-center justify-between text-xs"
                                    >
                                      <span className="font-mono text-muted-foreground">
                                        {col.name}
                                      </span>
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px]"
                                      >
                                        {col.type}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="questions" className="mt-3">
                          <div className="space-y-2">
                            {filteredQuestions.map((q, idx) => (
                              <button
                                key={q.id}
                                onClick={() => setCurrentQuestionIndex(idx)}
                                className={`w-full rounded-md border p-2 text-left text-sm transition-colors hover:bg-muted ${
                                  idx === currentQuestionIndex
                                    ? "border-primary bg-primary/5"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">Q{idx + 1}</span>
                                  <div className="flex items-center gap-1">
                                    <Badge
                                      variant="outline"
                                      className="text-[10px]"
                                    >
                                      {q.topic}
                                    </Badge>
                                    {(completedQuestions.includes(q.id) ||
                                      completedInSession.has(q.id)) && (
                                      <CheckCircle2 className="h-3 w-3 text-chart-1" />
                                    )}
                                  </div>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                  {q.prompt}
                                </p>
                              </button>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                )}

                <Link href={`/databases/${currentQuestion?.database}`}>
                  <Button variant="outline" className="w-full">
                    View Full Schema
                  </Button>
                </Link>
              </div>
            </div>

            {/* Sidebar - Mobile */}
            <div className="fixed bottom-4 right-4 lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
                    <Database className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[320px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>
                      {currentDatabase?.name || "Database"} Schema
                    </SheetTitle>
                  </SheetHeader>
                  {currentDatabase && (
                    <div className="mt-4">
                      <SchemaViewer database={currentDatabase} />
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
