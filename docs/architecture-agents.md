# Agent Architecture (AINative)

**Status:** Adopted (2026-05-21)  
**Tracks:** UX Parity Build Gate (Track A) → Agent platform (Track C)  
**Related:** [architecture.md](architecture.md), [ai-capability-matrix.md](spec/ai-capability-matrix.md), [command-parity-ledger.md](command-parity-ledger.md)

## Goals

1. **Reports generated** from live case data (`generate_case_report` / structured workspace) — not v1 export-button workflows (dead in v1).
2. **Guardrailed autonomous agents** run routine investigator work on the existing Tauri command surface.
3. **Destructive ops never auto-execute** — human confirm via graph interrupt (per [out-of-scope.md](spec/out-of-scope.md), with Agent mode DR below).

## Non-goals (v1 agent MVP)

- Porting v1 `export_case_report` UX
- Putting orchestration logic in Rust (`desktop-backend` stays domain-only)
- Auto-merge duplicates or auto-delete without approval
- Arcade.dev for native case file / SQLite mutations

## Stack (three layers)

```mermaid
flowchart TB
  subgraph desktop [apps/desktop]
    UI[Agent UI approvals run log]
    LG[LangGraph.js supervisor]
    MCP[CaseSpace MCP server]
    CC[command-client]
  end
  subgraph pkg [packages/agents]
    Graphs[subgraphs policy redaction]
  end
  subgraph optional [Track C3 optional]
    Arcade[Arcade MCP gateway]
    SaaS[OAuth SaaS]
  end
  subgraph backend [apps/desktop-backend]
    Rust[Tauri commands SQLite]
  end
  UI --> LG
  LG --> Graphs
  Graphs --> MCP
  Graphs -.-> Arcade
  MCP --> CC
  CC --> Rust
  Arcade --> SaaS
  LG -->|interrupt| UI
```

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| **Orchestration** | [LangGraph.js](https://langchain-ai.github.io/langgraph/) (`@langchain/langgraph`, `@langchain/core` only) | Supervisor + subgraphs, Sqlite checkpointer, `interrupt()` for confirm |
| **Native tools** | CaseSpace **MCP** (`@modelcontextprotocol/sdk`) | Tools call `command-client` → Tauri; no duplicate domain logic |
| **External tools** | [Arcade.dev](https://www.arcade.dev/) MCP gateway (later) | OAuth, credential vault, audit for Gmail/Slack/etc. |
| **LLM** | Provider-agnostic + redacted-cloud default | See [ai-capability-matrix.md](spec/ai-capability-matrix.md) |
| **Streaming UI** | Vercel AI SDK (optional) | Token stream in Agent panel; not the workflow engine |

## Orchestrator selection (ADR)

| Option | Verdict |
|--------|---------|
| **LangGraph.js** | **Default** — checkpoints, subgraphs, HITL interrupts fit case-long runs |
| **Mastra** | Fallback if C0 spike shows LangGraph friction on Tauri/Next |
| **OpenAI Agents SDK** | Good for simple loops + Arcade; weaker checkpoint/HITL |
| **Arcade alone** | Tool/auth runtime only, not orchestrator |
| **Custom agent loop** | Rejected — rebuilds interrupts/audit |

**C0 spike (gate before `packages/agents`):** report subgraph + one `confirm_required` tool + Sqlite checkpoint under app data dir. Document results in this file § Spike log.

## Tool policy

Enforced in graph middleware (not prompt-only):

| Tier | Examples | Behavior |
|------|----------|----------|
| `autonomous` | `load_case_files`, `search_all`, `generate_case_report`, `create_note`, `update_file_status` | Run and continue |
| `confirm_required` | `delete_case`, `remove_file_from_case`, `merge_duplicate_metadata` | `interrupt()` → desktop approval → resume |
| `human_only` | Raw-cloud opt-in, billing rate changes | Propose only; user acts in UI |

## Package layout (target)

```
packages/agents/          # consumed by apps/desktop only
  src/tools/              # Zod schemas from @repo/types + command ledger
  src/mcp/                # CaseSpace MCP server
  src/graphs/             # supervisor, triage, artifacts, report_generation
  src/policy/             # tool-policy, redaction
  src/checkpoint/         # SqliteSaver → casespace.db / agent_runs

apps/desktop/components/agents/   # Agent mode UI, approvals queue
```

## Subgraphs (priority)

1. **`report_generation`** — load case → section assembly → `generate_case_report` → interrupt for human review in reports workspace  
2. **`triage`** — post-sync status suggestions (AI-01)  
3. **`artifacts`** — draft notes/findings/timeline (AI-02/03)  

## Boundaries (elite architecture)

- **apps/desktop** — UX + LangGraph + MCP + `command-client` only  
- **apps/desktop-backend** — commands, SQLite, FTS; no LangChain  
- **apps/web** — no agent runtime  
- **packages/types** — shared contracts for tools and IPC  

## PII and runtime tiers

Per [ai-capability-matrix.md](spec/ai-capability-matrix.md): default **redacted-cloud**; raw paths/secrets stripped in `packages/agents/src/policy/redaction.ts` before LLM calls.

## Decision records

| Date | Decision |
|------|----------|
| 2026-05-21 | Adopt LangGraph + CaseSpace MCP + optional Arcade; v1 export port out of scope |
| 2026-05-21 | Agent mode: routine ops autonomous; destructive ops require confirm (DR-AGENT-001 in [discovery-appendix.md](spec/discovery-appendix.md)) |

## Spike log

| Date | LangGraph | Mastra | Notes |
|------|-----------|--------|-------|
| _pending_ | | | C0 spike before C1 merge |

## Implementation phases

See plan: Track C0 (this doc) → C1 MCP + `packages/agents` → C2 graphs + UI → C3 Arcade external → C4 validation.

Commands:

```bash
pnpm ops:validate:local   # after agent or board changes
pnpm test:parity          # backend command paths
```
