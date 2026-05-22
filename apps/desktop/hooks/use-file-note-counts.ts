import { useCallback, useEffect, useMemo, useState } from "react";
import { commandClient } from "@/lib/command-client";

export function useFileNoteCounts(caseId: string | undefined) {
  const [counts, setCounts] = useState<Map<string, number>>(new Map());

  const load = useCallback(async () => {
    if (!caseId) {
      setCounts(new Map());
      return;
    }
    const res = await commandClient.getFileNoteCounts(caseId);
    if (res.ok && res.data) {
      const map = new Map<string, number>();
      for (const row of res.data) {
        map.set(row.fileId, row.count);
      }
      setCounts(map);
    } else {
      setCounts(new Map());
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const getCount = useCallback(
    (fileId: string) => counts.get(fileId) ?? 0,
    [counts],
  );

  return useMemo(
    () => ({ noteCounts: counts, getCount, refetch: load }),
    [counts, getCount, load],
  );
}
