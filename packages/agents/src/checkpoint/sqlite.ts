/**
 * Sqlite checkpointer stub for agent runs (C1).
 * Persists graph state under casespace app data dir / agent_runs.
 */

export interface AgentRunRecord {
  runId: string;
  caseId: string;
  graphName: string;
  templateId?: string;
  status: "running" | "interrupted" | "completed" | "failed";
  checkpointJson?: string;
  updatedAt: string;
}

export interface AgentCheckpointStore {
  save(record: AgentRunRecord): Promise<void>;
  load(runId: string): Promise<AgentRunRecord | null>;
}

/** In-memory stub until desktop wires native Sqlite agent_runs table. */
export class MemoryAgentCheckpointStore implements AgentCheckpointStore {
  private runs = new Map<string, AgentRunRecord>();

  async save(record: AgentRunRecord): Promise<void> {
    this.runs.set(record.runId, record);
  }

  async load(runId: string): Promise<AgentRunRecord | null> {
    return this.runs.get(runId) ?? null;
  }
}

export function createAgentCheckpointStore(): AgentCheckpointStore {
  return new MemoryAgentCheckpointStore();
}
