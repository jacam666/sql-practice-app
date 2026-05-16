// Core types for the SQL Practice App

export type Difficulty = "beginner" | "intermediate" | "interview";

export type Topic =
  | "SELECT"
  | "WHERE"
  | "ORDER BY"
  | "GROUP BY"
  | "HAVING"
  | "JOINs"
  | "subqueries"
  | "window functions";

export type DatabaseName = "city" | "store" | "gym" | "anime";

export interface Column {
  name: string;
  type: string;
  primaryKey?: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
  nullable?: boolean;
}

export interface Table {
  name: string;
  columns: Column[];
  sampleData: Record<string, unknown>[];
}

export interface Database {
  id: DatabaseName;
  name: string;
  description: string;
  tables: Table[];
}

export interface SQLQuestion {
  id: string;
  database: DatabaseName;
  topic: Topic;
  difficulty: Difficulty;
  prompt: string;
  starterSql: string;
  expectedSql: string;
  expectedColumns: string[];
  expectedRows: Record<string, unknown>[];
  hint: string;
  explanation: string;
}

export interface UserProgress {
  completedQuestions: string[];
  topicScores: Record<Topic, { correct: number; total: number }>;
  lastActivity: string;
}
