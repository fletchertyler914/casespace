import { useCallback, useEffect, useState } from "react";
import type { CaseFile } from "@repo/types";
import { commandClient } from "@/lib/command-client";

const MAX_CHECKS = 50;
const DEBOUNCE_MS = 30_000;

export function useBoardFileChanges(caseId: string | undefined, files: CaseFile[]) {
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set());

  const check = useCallback(async () => {
    if (!caseId || files.length === 0) {
      setChangedIds(new Set());
      return;
    }
    const toCheck = files.slice(0, MAX_CHECKS);
    const changed = new Set<string>();
    await Promise.all(
      toCheck.map(async (file) => {
        const res = await commandClient.checkFileChanged(caseId, file.id);
        if (res.ok && res.data?.changed) {
          changed.add(file.id);
        }
      }),
    );
    setChangedIds(changed);
  }, [caseId, files]);

  useEffect(() => {
    void check();
    const id = window.setInterval(() => void check(), DEBOUNCE_MS);
    return () => window.clearInterval(id);
  }, [check]);

  return changedIds;
}
