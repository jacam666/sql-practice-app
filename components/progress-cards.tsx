"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  getProgress,
  getOverallScore,
  getWeakTopics,
  type UserProgress,
  type Topic,
} from "@/lib/data";
import { questions } from "@/lib/data/questions";

export function ProgressCards() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProgress(getProgress());
  }, []);

  if (!mounted) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-24 rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const overallScore = progress ? getOverallScore(progress) : 0;
  const completedCount = progress?.completedQuestions.length || 0;
  const totalQuestions = questions.length;
  const weakTopics = progress ? getWeakTopics(progress) : [];
  const lastActive = progress?.lastActivity
    ? new Date(progress.lastActivity).toLocaleDateString()
    : "Never";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Overall Score
          </CardTitle>
          <Trophy className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overallScore}%</div>
          <Progress value={overallScore} className="mt-2 h-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Questions Completed
          </CardTitle>
          <Target className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {completedCount}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              / {totalQuestions}
            </span>
          </div>
          <Progress
            value={(completedCount / totalQuestions) * 100}
            className="mt-2 h-2"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Areas to Improve
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          {weakTopics.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {weakTopics.slice(0, 2).map((topic) => (
                <Badge key={topic} variant="secondary" className="text-xs">
                  {topic}
                </Badge>
              ))}
              {weakTopics.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{weakTopics.length - 2}
                </Badge>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Looking good!
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Last Activity
          </CardTitle>
          <Clock className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lastActive}</div>
        </CardContent>
      </Card>
    </div>
  );
}

const topics: { name: Topic; description: string; icon: React.ReactNode }[] = [
  {
    name: "SELECT",
    description: "Basic data retrieval",
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  {
    name: "WHERE",
    description: "Filtering rows",
    icon: <Target className="h-5 w-5" />,
  },
  {
    name: "ORDER BY",
    description: "Sorting results",
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    name: "GROUP BY",
    description: "Aggregating data",
    icon: <AlertCircle className="h-5 w-5" />,
  },
  {
    name: "HAVING",
    description: "Filtering groups",
    icon: <Target className="h-5 w-5" />,
  },
  {
    name: "JOINs",
    description: "Combining tables",
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  {
    name: "subqueries",
    description: "Nested queries",
    icon: <AlertCircle className="h-5 w-5" />,
  },
  {
    name: "window functions",
    description: "Advanced analytics",
    icon: <TrendingUp className="h-5 w-5" />,
  },
];

export function TopicGrid() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProgress(getProgress());
  }, []);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {topics.map((topic) => {
        const topicScore = mounted && progress 
          ? progress.topicScores[topic.name] 
          : { correct: 0, total: 0 };
        const accuracy =
          topicScore.total > 0
            ? Math.round((topicScore.correct / topicScore.total) * 100)
            : null;

        return (
          <Link
            key={topic.name}
            href={`/practice?topic=${encodeURIComponent(topic.name)}`}
          >
            <Card className="group cursor-pointer transition-all hover:border-primary hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {topic.icon}
                  </div>
                  {accuracy !== null && (
                    <Badge
                      variant={accuracy >= 70 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {accuracy}%
                    </Badge>
                  )}
                </div>
                <h3 className="mt-3 font-semibold group-hover:text-primary">
                  {topic.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {topic.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
