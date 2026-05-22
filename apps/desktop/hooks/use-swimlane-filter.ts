import { useCallback, useEffect, useMemo, useState } from "react";
import type { CaseFile } from "@repo/types";
import {
  BOARD_STATUSES,
  type BoardStatus,
} from "@/lib/board-status";
import {
  filterSwimlaneFiles,
  groupFilesByBoardStatus,
} from "@/lib/swimlane-filter";

export function useSwimlaneFilter(files: CaseFile[], debounceMs = 250) {
  const [filterQueries, setFilterQueries] = useState<
    Partial<Record<BoardStatus, string>>
  >({});
  const [filterVisible, setFilterVisible] = useState<
    Partial<Record<BoardStatus, boolean>>
  >({});
  const [debouncedQueries, setDebouncedQueries] = useState<
    Partial<Record<BoardStatus, string>>
  >({});

  useEffect(() => {
    const timeouts: Partial<Record<BoardStatus, ReturnType<typeof setTimeout>>> =
      {};
    for (const { value } of BOARD_STATUSES) {
      const query = filterQueries[value] ?? "";
      timeouts[value] = setTimeout(() => {
        setDebouncedQueries((prev) => ({ ...prev, [value]: query }));
      }, debounceMs);
    }
    return () => {
      for (const id of Object.values(timeouts)) {
        if (id) clearTimeout(id);
      }
    };
  }, [filterQueries, debounceMs]);

  const filteredByStatus = useMemo(() => {
    const grouped = groupFilesByBoardStatus(files);
    const result = new Map<BoardStatus, CaseFile[]>();
    for (const { value } of BOARD_STATUSES) {
      const lane = grouped.get(value) ?? [];
      const query = debouncedQueries[value] ?? "";
      result.set(value, filterSwimlaneFiles(lane, query));
    }
    return result;
  }, [files, debouncedQueries]);

  const setFilterQuery = useCallback((status: BoardStatus, query: string) => {
    setFilterQueries((prev) => ({ ...prev, [status]: query }));
  }, []);

  const toggleFilter = useCallback((status: BoardStatus) => {
    setFilterVisible((prev) => ({ ...prev, [status]: !prev[status] }));
  }, []);

  const clearFilter = useCallback((status: BoardStatus) => {
    setFilterQueries((prev) => ({ ...prev, [status]: "" }));
    setDebouncedQueries((prev) => ({ ...prev, [status]: "" }));
  }, []);

  return {
    filterQueries,
    filterVisible,
    filteredByStatus,
    setFilterQuery,
    toggleFilter,
    clearFilter,
  };
}
