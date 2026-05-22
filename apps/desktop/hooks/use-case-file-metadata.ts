import { useCallback, useEffect, useMemo, useState } from "react";
import { commandClient } from "@/lib/command-client";
import { parseMetadataJson } from "@/lib/mapping/display";

export function useCaseFileMetadata(caseId: string | undefined) {
  const [metadataByFileId, setMetadataByFileId] = useState<
    Map<string, Record<string, unknown>>
  >(new Map());

  const load = useCallback(async () => {
    if (!caseId) {
      setMetadataByFileId(new Map());
      return;
    }
    const res = await commandClient.listCaseFileMetadata(caseId);
    if (res.ok && res.data) {
      const map = new Map<string, Record<string, unknown>>();
      for (const row of res.data) {
        map.set(row.fileId, parseMetadataJson(row.metadataJson));
      }
      setMetadataByFileId(map);
    } else {
      setMetadataByFileId(new Map());
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  return useMemo(
    () => ({ metadataByFileId, refetch: load }),
    [metadataByFileId, load],
  );
}
