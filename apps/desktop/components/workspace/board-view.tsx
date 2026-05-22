"use client";

import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PanelLeft } from "lucide-react";
import type { CaseFile } from "@repo/types";
import { Button } from "@/components/ui/button";
import { BOARD_STATUSES, normalizeBoardStatus } from "@/lib/board-status";
import {
  findGroupForFile,
  type DuplicateGroup,
} from "@/lib/duplicate-utils";
import { commandClient } from "@/lib/command-client";
import { getKeyMappingFields } from "@/lib/mapping/display";
import { parseMappingConfig, type FieldMapping } from "@/lib/mapping/types";
import { useBoardFileChanges } from "@/hooks/use-board-file-changes";
import { useCaseFileMetadata } from "@/hooks/use-case-file-metadata";
import { useFileNoteCounts } from "@/hooks/use-file-note-counts";
import { useSwimlaneFilter } from "@/hooks/use-swimlane-filter";
import { useWorkflowSelection } from "@/hooks/use-workflow-selection";
const LazyProgressDashboard = lazy(() =>
  import("./progress-dashboard").then((m) => ({
    default: m.ProgressDashboard,
  })),
);
import {
  BoardSwimlaneColumn,
  BoardSwimlaneEmpty,
} from "./board-swimlane-column";
import { BoardWorkflowCard } from "./board-workflow-card";

interface BoardViewProps {
  caseId: string;
  files: CaseFile[];
  totalFileCount?: number;
  viewingFile: CaseFile | null;
  navigatorOpen: boolean;
  selectedFolderPath?: string | null;
  duplicateGroups?: DuplicateGroup[];
  onExpandNavigator: () => void;
  onFileOpen: (file: CaseFile) => void;
  onStatusChange: (fileId: string, status: string) => void;
}

function SortableBoardCard({
  file,
  isSelected,
  isDragging,
  isDuplicate,
  isPrimaryDuplicate,
  fileChanged,
  noteCount,
  mappingFields,
  selectedFolderPath,
  onSelect,
  onFileOpen,
}: {
  file: CaseFile;
  isSelected: boolean;
  isDragging: boolean;
  isDuplicate: boolean;
  isPrimaryDuplicate: boolean;
  fileChanged: boolean;
  noteCount: number;
  mappingFields: ReturnType<typeof getKeyMappingFields>;
  selectedFolderPath: string | null;
  onSelect: (event: React.MouseEvent) => void;
  onFileOpen: (file: CaseFile) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: `file-${file.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <BoardWorkflowCard
        file={file}
        isSelected={isSelected}
        isDragging={isDragging || isSortableDragging}
        isDuplicate={isDuplicate}
        isPrimaryDuplicate={isPrimaryDuplicate}
        fileChanged={fileChanged}
        noteCount={noteCount}
        mappingFields={mappingFields}
        selectedFolderPath={selectedFolderPath}
        onSelect={onSelect}
        onFileOpen={onFileOpen}
        dragListeners={listeners}
        dragAttributes={attributes}
      />
    </div>
  );
}

function isMacOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { userAgentData?: { platform: string } };
  if (nav.userAgentData?.platform) {
    return nav.userAgentData.platform.toLowerCase() === "macos";
  }
  return navigator.platform?.toUpperCase().includes("MAC") ?? false;
}

export const BoardView = memo(function BoardView({
  caseId,
  files,
  totalFileCount,
  viewingFile,
  navigatorOpen,
  selectedFolderPath = null,
  duplicateGroups = [],
  onExpandNavigator,
  onFileOpen,
  onStatusChange,
}: BoardViewProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mappingRules, setMappingRules] = useState<FieldMapping[]>([]);

  const { getCount: getNoteCount, refetch: refetchNoteCounts } =
    useFileNoteCounts(caseId);
  const { metadataByFileId } = useCaseFileMetadata(caseId);
  const changedFileIds = useBoardFileChanges(caseId, files);

  useEffect(() => {
    void commandClient.getMappingConfigDb(caseId).then((res) => {
      if (res.ok && res.data) {
        setMappingRules(parseMappingConfig(res.data).mappings);
      }
    });
  }, [caseId]);

  useEffect(() => {
    void refetchNoteCounts();
  }, [files.length, refetchNoteCounts]);
  const [overId, setOverId] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [draggingSelectedFiles, setDraggingSelectedFiles] = useState<CaseFile[]>(
    [],
  );

  const fileIds = useMemo(() => files.map((f) => f.id), [files]);
  const { isSelected, handleSelect, selectedCount } = useWorkflowSelection({
    selectedIds: selectedFileIds,
    onSelectionChange: setSelectedFileIds,
    fileIds,
  });

  const {
    filterQueries,
    filterVisible,
    filteredByStatus,
    setFilterQuery,
    toggleFilter,
    clearFilter,
  } = useSwimlaneFilter(files);

  const duplicateMeta = useMemo(() => {
    const map = new Map<
      string,
      { isDuplicate: boolean; isPrimary: boolean }
    >();
    for (const file of files) {
      const group = findGroupForFile(duplicateGroups, file.id);
      if (!group) continue;
      map.set(file.id, {
        isDuplicate: true,
        isPrimary: group.primaryFileId === file.id,
      });
    }
    return map;
  }, [duplicateGroups, files]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    }),
  );

  const modifierHint = useMemo(() => (isMacOS() ? "⌘" : "⌃"), []);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      setActiveId(id);

      if (selectedFileIds.length > 1 && id.startsWith("file-")) {
        const draggedId = id.replace("file-", "");
        if (selectedFileIds.includes(draggedId)) {
          setDraggingSelectedFiles(
            files.filter((f) => selectedFileIds.includes(f.id)),
          );
          return;
        }
      }
      setDraggingSelectedFiles([]);
    },
    [files, selectedFileIds],
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over ? String(event.over.id) : null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const active = String(event.active.id);
      const over = event.over ? String(event.over.id) : null;

      setActiveId(null);
      setOverId(null);

      if (!over) {
        setDraggingSelectedFiles([]);
        return;
      }

      let newStatus: string | null = null;
      if (over.startsWith("column-")) {
        newStatus = over.replace("column-", "");
      } else if (over.startsWith("file-")) {
        const overFileId = over.replace("file-", "");
        const overFile = files.find((f) => f.id === overFileId);
        if (overFile) {
          newStatus = normalizeBoardStatus(overFile.status);
        }
      }

      if (!newStatus || !BOARD_STATUSES.some((s) => s.value === newStatus)) {
        setDraggingSelectedFiles([]);
        return;
      }

      const targets =
        draggingSelectedFiles.length > 0
          ? draggingSelectedFiles
          : active.startsWith("file-")
            ? files.filter((f) => f.id === active.replace("file-", ""))
            : [];

      for (const file of targets) {
        if (normalizeBoardStatus(file.status) !== newStatus) {
          onStatusChange(file.id, newStatus);
        }
      }

      setDraggingSelectedFiles([]);
    },
    [draggingSelectedFiles, files, onStatusChange],
  );

  const activeFile = useMemo(() => {
    if (!activeId?.startsWith("file-")) return null;
    const id = activeId.replace("file-", "");
    return files.find((f) => f.id === id) ?? null;
  }, [activeId, files]);

  const isMultiDrag = draggingSelectedFiles.length > 1;

  const folderName = selectedFolderPath
    ? selectedFolderPath.split("/").pop() || selectedFolderPath
    : null;
  const allCount = totalFileCount ?? files.length;

  useEffect(() => {
    if (selectedCount === 0) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (activeId) return;
      const target = event.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("input") ||
        target.closest("[role='dialog']")
      ) {
        return;
      }
      if (target.closest("[data-workflow-card]")) return;
      if (boardRef.current?.contains(target)) {
        setSelectedFileIds([]);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [selectedCount, activeId]);

  return (
    <div ref={boardRef} className="flex h-full min-h-0 flex-col bg-background">
      <div className="shrink-0 border-b border-border/40 px-4 pt-3 pb-3">
        <div className="mb-3 flex items-center gap-2">
          {!navigatorOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onExpandNavigator}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold">Workflow board</h2>
            {selectedFolderPath && (
              <p className="text-xs text-muted-foreground">
                Showing {files.length} of {allCount} files from &quot;{folderName}
                &quot;
              </p>
            )}
          </div>
        </div>
        {files.length > 0 && (
          <Suspense fallback={<div className="h-8 animate-pulse rounded bg-muted/30" />}>
            <LazyProgressDashboard files={files} />
          </Suspense>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-border/20 px-4 py-2">
            <p className="text-xs text-muted-foreground/60">
              {selectedCount > 0 ? (
                <>
                  <span className="font-medium text-muted-foreground">
                    {selectedCount} selected
                  </span>
                  {" • "}
                </>
              ) : null}
              Drag cards between lanes to change status. {modifierHint}+Click to
              multiselect, Shift+Click for range.
            </p>
          </div>

          {files.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No files in this case. Sync sources from the header menu.
            </p>
          ) : (
            <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
              <div className="flex h-full items-start gap-3 p-4 pb-6">
                {BOARD_STATUSES.map((state) => {
                  const laneFiles = filteredByStatus.get(state.value) ?? [];
                  const isOver = overId === `column-${state.value}`;
                  const dup = duplicateMeta;

                  return (
                    <BoardSwimlaneColumn
                      key={state.value}
                      status={state.value}
                      label={state.label}
                      headerClass={state.headerClass}
                      count={laneFiles.length}
                      isOver={isOver}
                      itemIds={laneFiles.map((f) => `file-${f.id}`)}
                      filterQuery={filterQueries[state.value] ?? ""}
                      filterVisible={!!filterVisible[state.value]}
                      onFilterToggle={() => toggleFilter(state.value)}
                      onFilterChange={(query) =>
                        setFilterQuery(state.value, query)
                      }
                      onFilterClear={() => clearFilter(state.value)}
                    >
                      {laneFiles.length === 0 ? (
                        <BoardSwimlaneEmpty isOver={isOver} />
                      ) : (
                        laneFiles.map((file) => {
                          const meta = dup.get(file.id);
                          const metaJson =
                            metadataByFileId.get(file.id) ?? {};
                          const mappingFields = getKeyMappingFields(
                            metaJson,
                            mappingRules,
                            2,
                          );
                          return (
                            <SortableBoardCard
                              key={file.id}
                              file={file}
                              isSelected={
                                isSelected(file.id) ||
                                viewingFile?.id === file.id
                              }
                              isDragging={activeId === `file-${file.id}`}
                              isDuplicate={meta?.isDuplicate ?? false}
                              isPrimaryDuplicate={meta?.isPrimary ?? false}
                              fileChanged={changedFileIds.has(file.id)}
                              noteCount={getNoteCount(file.id)}
                              mappingFields={mappingFields}
                              selectedFolderPath={selectedFolderPath}
                              onSelect={(event) =>
                                handleSelect(file.id, event)
                              }
                              onFileOpen={onFileOpen}
                            />
                          );
                        })
                      )}
                    </BoardSwimlaneColumn>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DragOverlay>
          {activeFile ? (
            isMultiDrag ? (
              <div
                className="relative"
                style={{ minWidth: 340, minHeight: 120 }}
              >
                {draggingSelectedFiles.slice(0, 3).map((file, idx) => (
                  <div
                    key={file.id}
                    className="absolute"
                    style={{
                      transform: `translate(${idx * 8}px, ${idx * 8}px) rotate(${idx * 2}deg)`,
                      zIndex: draggingSelectedFiles.length - idx,
                    }}
                  >
                    <BoardWorkflowCard
                      file={file}
                      isDragging
                      isDuplicate={duplicateMeta.get(file.id)?.isDuplicate}
                      isPrimaryDuplicate={
                        duplicateMeta.get(file.id)?.isPrimary ?? false
                      }
                      selectedFolderPath={selectedFolderPath}
                    />
                  </div>
                ))}
                {draggingSelectedFiles.length > 3 && (
                  <div
                    className="absolute top-2 right-2 z-50 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground shadow-lg"
                    style={{ transform: "translate(24px, 24px)" }}
                  >
                    +{draggingSelectedFiles.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <BoardWorkflowCard
                file={activeFile}
                isDragging
                isDuplicate={duplicateMeta.get(activeFile.id)?.isDuplicate}
                isPrimaryDuplicate={
                  duplicateMeta.get(activeFile.id)?.isPrimary ?? false
                }
                selectedFolderPath={selectedFolderPath}
              />
            )
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
});
