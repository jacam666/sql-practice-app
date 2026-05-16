import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, Flame, Award } from "lucide-react";
import type { Difficulty } from "@/lib/data";

const difficultyConfig: Record<
  Difficulty,
  {
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }
> = {
  beginner: {
    label: "Beginner",
    description: "Start here to build SQL foundations",
    icon: <Sparkles className="h-5 w-5" />,
    color: "bg-chart-1/10 text-chart-1",
  },
  intermediate: {
    label: "Intermediate",
    description: "JOINs, GROUP BY, and aggregations",
    icon: <Flame className="h-5 w-5" />,
    color: "bg-chart-4/10 text-chart-4",
  },
  interview: {
    label: "Interview",
    description: "Real interview-style challenges",
    icon: <Award className="h-5 w-5" />,
    color: "bg-chart-5/10 text-chart-5",
  },
};

export function DifficultyCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {(Object.keys(difficultyConfig) as Difficulty[]).map((difficulty) => {
        const config = difficultyConfig[difficulty];
        return (
          <Link
            key={difficulty}
            href={`/practice?difficulty=${difficulty}`}
            className="block"
          >
            <Card className="group h-full cursor-pointer transition-all hover:border-primary hover:shadow-md">
              <CardContent className="p-5">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${config.color}`}
                >
                  {config.icon}
                </div>
                <h3 className="mt-4 font-semibold group-hover:text-primary">
                  {config.label}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {config.description}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 -ml-2 text-muted-foreground group-hover:text-primary"
                >
                  Start Practice
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
