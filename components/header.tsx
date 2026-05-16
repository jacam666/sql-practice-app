"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Database,
  Code2,
  BarChart3,
  BookOpen,
  ChevronRight,
  Moon,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";

export function Header() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const dark = document.documentElement.classList.contains("dark");
    setIsDark(dark);
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Database className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">SQL Practice</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/practice">
              <Button variant="ghost" size="sm">
                <Code2 className="mr-2 h-4 w-4" />
                Practice
              </Button>
            </Link>
            <Link href="/databases">
              <Button variant="ghost" size="sm">
                <BookOpen className="mr-2 h-4 w-4" />
                Databases
              </Button>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Link href="/practice" className="hidden sm:block">
              <Button size="sm">
                Start Practice
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
