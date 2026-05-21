"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpDown,
  Briefcase,
  FolderOpen,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { CaseSummary } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { CaseListCard, type CaseWithCounts } from "./case-list-card";
import { CaseListViewMode } from "./case-list-view-mode";
import { CreateCaseDialog } from "./create-case-dialog";
import { DeleteCaseConfirmationDialog } from "./delete-case-confirmation-dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { commandClient } from "@/lib/command-client";

type SortOption = "recent" | "name" | "created";

const ADAPTIVE_LIST_THRESHOLD = 20;
const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_RECENT = 5;

export function CaseListView() {
  const router = useRouter();
  const { toast } = useToast();

  const [cases, setCases] = useState<CaseWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [fileCountsLoading, setFileCountsLoading] = useState<Set<string>>(
    new Set(),
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CaseSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 150);
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const searchRef = useRef<HTMLInputElement>(null);
  const hasAutoSwitched = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await commandClient.listCases();
      if (!response.ok || !response.data) {
        throw new Error(response.error?.message ?? "Unable to list cases");
      }
      const next = response.data as CaseWithCounts[];
      setCases(next);
      setFileCountsLoading(new Set(next.map((c) => c.id)));

      void Promise.all(
        next.map(async (c) => {
          try {
            const filesRes = await commandClient.loadCaseFiles(c.id);
            const count = filesRes.ok && filesRes.data ? filesRes.data.length : 0;
            const sources = c.sourcePaths ?? [];
            setCases((prev) =>
              prev.map((p) =>
                p.id === c.id ? { ...p, fileCount: count, sources } : p,
              ),
            );
          } finally {
            setFileCountsLoading((prev) => {
              const copy = new Set(prev);
              copy.delete(c.id);
              return copy;
            });
          }
        }),
      );
    } catch (error) {
      toast({
        title: "Failed to load cases",
        description:
          error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (
      cases.length >= ADAPTIVE_LIST_THRESHOLD &&
      !hasAutoSwitched.current &&
      viewMode === "grid"
    ) {
      setViewMode("list");
      hasAutoSwitched.current = true;
    } else if (cases.length < ADAPTIVE_LIST_THRESHOLD) {
      hasAutoSwitched.current = false;
    }
  }, [cases.length, viewMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        !!target?.isContentEditable;
      if (isInput && target !== searchRef.current) return;
      const meta = navigator.platform.toUpperCase().includes("MAC")
        ? e.metaKey
        : e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    let result = cases;
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.status.toLowerCase().includes(q),
      );
    }
    return result;
  }, [cases, debouncedQuery]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    switch (sortOption) {
      case "name":
        return copy.sort((a, b) => a.name.localeCompare(b.name));
      case "created":
        return copy.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      case "recent":
      default:
        return copy.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
    }
  }, [filtered, sortOption]);

  const { recent, others } = useMemo(() => {
    const cutoff = Date.now() - RECENT_WINDOW_MS;
    const r = sorted
      .filter((c) => new Date(c.updatedAt).getTime() >= cutoff)
      .slice(0, MAX_RECENT);
    const ids = new Set(r.map((c) => c.id));
    return { recent: r, others: sorted.filter((c) => !ids.has(c.id)) };
  }, [sorted]);

  const handleSelect = useCallback(
    (case_: CaseSummary) => {
      router.push(`/case?id=${encodeURIComponent(case_.id)}`);
    },
    [router],
  );

  const handleCreate = useCallback(
    async ({ name, sources }: { name: string; sources: string[] }) => {
      const res = await commandClient.createCase({
        name,
        sourcePaths: sources,
      });
      if (!res.ok || !res.data) {
        throw new Error(res.error?.message ?? "Unable to create case");
      }
      toast({
        title: "Case created",
        description: `"${name}" is ready.`,
      });
      await refresh();
      router.push(`/case?id=${encodeURIComponent(res.data.id)}`);
    },
    [refresh, router, toast],
  );

  const handleDeleteRequest = useCallback(
    (case_: CaseSummary, e: React.MouseEvent) => {
      e.stopPropagation();
      setDeleteTarget(case_);
    },
    [],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await commandClient.deleteCase(deleteTarget.id);
      if (!res.ok) {
        throw new Error(res.error?.message ?? "Unable to delete case");
      }
      toast({
        title: "Case deleted",
        description: `"${deleteTarget.name}" was removed.`,
      });
      setDeleteTarget(null);
      await refresh();
    } catch (error) {
      toast({
        title: "Failed to delete case",
        description:
          error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, refresh, toast]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col">
        <div className="flex-shrink-0 border-b border-border/30 p-8 dark:border-border/40">
          <Skeleton className="mb-2 h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex-1 space-y-4 p-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-border/30 p-6 dark:border-border/40"
            >
              <Skeleton className="mb-3 h-6 w-48" />
              <Skeleton className="mb-4 h-4 w-full" />
              <div className="mb-3 flex gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const total = sorted.length;
  const hasRecentSection = recent.length > 0;
  const noResults = total === 0;
  const isFiltering = debouncedQuery.trim().length > 0;

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 flex-shrink-0 border-b border-border/30 bg-background/80 p-8 backdrop-blur-sm dark:border-border/40">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-primary/20 bg-primary/10 p-2">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Cases</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage and organize your investigation cases
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cases by name, ID, or status (Cmd/Ctrl+K)"
                className="h-10 pl-9 pr-9"
              />
              {searchQuery ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>

            <Select
              value={sortOption}
              onValueChange={(v) => setSortOption(v as SortOption)}
            >
              <SelectTrigger className="h-10 w-[180px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Updated</SelectItem>
                <SelectItem value="name">Name (A–Z)</SelectItem>
                <SelectItem value="created">Date Created</SelectItem>
              </SelectContent>
            </Select>

            <CaseListViewMode
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            <Button onClick={() => setCreateOpen(true)} className="h-10">
              <Plus className="mr-2 h-4 w-4" />
              New Case
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="relative z-10 flex-1">
        <div className="p-8">
          {noResults ? (
            <div className="flex flex-col items-center justify-center px-4 py-24">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
                <div className="relative rounded-2xl border border-border/30 bg-muted/50 p-6 dark:border-border/40">
                  <FolderOpen className="h-16 w-16 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                {isFiltering ? "No cases found" : "No cases yet"}
              </h3>
              <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
                {isFiltering
                  ? "Try adjusting your search to find what you're looking for."
                  : "Get started by creating your first case to organize evidence, take notes, and produce reports."}
              </p>
              <Button size="lg" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first case
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {hasRecentSection ? (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Recently Updated</h2>
                    <div className="text-sm text-muted-foreground">
                      {total} {total === 1 ? "case" : "cases"}
                      {isFiltering ? ` matching "${debouncedQuery}"` : ""}
                    </div>
                  </div>
                  <CaseGrid
                    cases={recent}
                    viewMode={viewMode}
                    isRecent
                    fileCountsLoading={fileCountsLoading}
                    onSelect={handleSelect}
                    onDelete={handleDeleteRequest}
                  />
                </section>
              ) : null}

              {others.length > 0 ? (
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold">
                    All Cases
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({others.length})
                    </span>
                  </h2>
                  <CaseGrid
                    cases={others}
                    viewMode={viewMode}
                    fileCountsLoading={fileCountsLoading}
                    onSelect={handleSelect}
                    onDelete={handleDeleteRequest}
                  />
                </section>
              ) : null}
            </div>
          )}
        </div>
      </ScrollArea>

      <CreateCaseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
      />

      <DeleteCaseConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        caseName={deleteTarget?.name ?? ""}
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

function CaseGrid({
  cases,
  viewMode,
  isRecent = false,
  fileCountsLoading,
  onSelect,
  onDelete,
}: {
  cases: CaseWithCounts[];
  viewMode: "grid" | "list";
  isRecent?: boolean;
  fileCountsLoading: Set<string>;
  onSelect: (c: CaseSummary) => void;
  onDelete: (c: CaseSummary, e: React.MouseEvent) => void;
}) {
  if (viewMode === "grid") {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cases.map((case_) => (
          <CaseListCard
            key={case_.id}
            case_={case_}
            viewMode="grid"
            isRecent={isRecent}
            loadingFileCount={fileCountsLoading.has(case_.id)}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {cases.map((case_) => (
        <CaseListCard
          key={case_.id}
          case_={case_}
          viewMode="list"
          isRecent={isRecent}
          loadingFileCount={fileCountsLoading.has(case_.id)}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
