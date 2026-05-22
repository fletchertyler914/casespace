"use client";

import { useCallback, useState } from "react";
import type { TimeEntry } from "@repo/types";
import { commandClient } from "@/lib/command-client";

const PAGE_SIZE = 50;

export function useTimeEntries(caseId: string) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await commandClient.getTimeEntries(caseId, PAGE_SIZE, 0);
    if (res.ok && res.data) {
      setEntries(res.data);
      setHasMore(res.data.length >= PAGE_SIZE);
      setOffset(res.data.length);
    }
    setLoading(false);
  }, [caseId]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    const res = await commandClient.getTimeEntries(caseId, PAGE_SIZE, offset);
    if (res.ok && res.data) {
      setEntries((prev) => [...prev, ...res.data!]);
      setHasMore(res.data.length >= PAGE_SIZE);
      setOffset((o) => o + res.data!.length);
    }
    setLoading(false);
  }, [caseId, hasMore, loading, offset]);

  const removeEntry = useCallback((entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  const upsertEntry = useCallback((entry: TimeEntry) => {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === entry.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = entry;
        return next;
      }
      return [entry, ...prev].sort((a, b) =>
        b.entryDate.localeCompare(a.entryDate),
      );
    });
  }, []);

  const updateEntrySummary = useCallback(
    async (entryId: string, summary: string) => {
      const prev = entries;
      setEntries((list) =>
        list.map((e) => (e.id === entryId ? { ...e, summary } : e)),
      );
      const res = await commandClient.updateTimeEntry(entryId, { summary });
      if (!res.ok) {
        setEntries(prev);
        return res;
      }
      if (res.data) upsertEntry(res.data);
      return res;
    },
    [entries, upsertEntry],
  );

  const deleteEntry = useCallback(
    async (entryId: string) => {
      const prev = entries;
      removeEntry(entryId);
      const res = await commandClient.deleteTimeEntry(entryId);
      if (!res.ok) setEntries(prev);
      return res;
    },
    [entries, removeEntry],
  );

  const deleteSegment = useCallback(
    async (entryId: string, segmentId: string) => {
      const prev = entries;
      setEntries((list) =>
        list.map((e) =>
          e.id === entryId
            ? {
                ...e,
                segments: (e.segments ?? []).filter((s) => s.id !== segmentId),
              }
            : e,
        ),
      );
      const res = await commandClient.deleteTimeSegment(segmentId);
      if (!res.ok) {
        setEntries(prev);
        return res;
      }
      await refresh();
      return res;
    },
    [entries, refresh],
  );

  return {
    entries,
    loading,
    hasMore,
    refresh,
    loadMore,
    removeEntry,
    upsertEntry,
    updateEntrySummary,
    deleteEntry,
    deleteSegment,
    setEntries,
  };
};
