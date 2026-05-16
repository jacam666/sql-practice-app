"use client";

import type { Topic, UserProgress } from "./types";

const STORAGE_KEY = "sql-practice-progress";

const defaultProgress: UserProgress = {
  completedQuestions: [],
  topicScores: {
    SELECT: { correct: 0, total: 0 },
    WHERE: { correct: 0, total: 0 },
    "ORDER BY": { correct: 0, total: 0 },
    "GROUP BY": { correct: 0, total: 0 },
    HAVING: { correct: 0, total: 0 },
    JOINs: { correct: 0, total: 0 },
    subqueries: { correct: 0, total: 0 },
    "window functions": { correct: 0, total: 0 },
  },
  lastActivity: new Date().toISOString(),
};

export function getProgress(): UserProgress {
  if (typeof window === "undefined") return defaultProgress;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultProgress;
  
  try {
    return JSON.parse(stored) as UserProgress;
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function markQuestionComplete(
  questionId: string,
  topic: Topic,
  isCorrect: boolean
): UserProgress {
  const progress = getProgress();
  
  // Add to completed if not already there
  if (!progress.completedQuestions.includes(questionId)) {
    progress.completedQuestions.push(questionId);
  }
  
  // Update topic scores
  progress.topicScores[topic].total += 1;
  if (isCorrect) {
    progress.topicScores[topic].correct += 1;
  }
  
  progress.lastActivity = new Date().toISOString();
  
  saveProgress(progress);
  return progress;
}

export function getOverallScore(progress: UserProgress): number {
  const totalCorrect = Object.values(progress.topicScores).reduce(
    (sum, score) => sum + score.correct,
    0
  );
  const totalAttempts = Object.values(progress.topicScores).reduce(
    (sum, score) => sum + score.total,
    0
  );
  
  if (totalAttempts === 0) return 0;
  return Math.round((totalCorrect / totalAttempts) * 100);
}

export function getTopicAccuracy(progress: UserProgress, topic: Topic): number {
  const score = progress.topicScores[topic];
  if (score.total === 0) return 0;
  return Math.round((score.correct / score.total) * 100);
}

export function getWeakTopics(progress: UserProgress): Topic[] {
  const topicsWithAttempts = (Object.entries(progress.topicScores) as [Topic, { correct: number; total: number }][])
    .filter(([, score]) => score.total > 0);
  
  if (topicsWithAttempts.length === 0) return [];
  
  return topicsWithAttempts
    .filter(([, score]) => score.correct / score.total < 0.7)
    .map(([topic]) => topic);
}

export function resetProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
