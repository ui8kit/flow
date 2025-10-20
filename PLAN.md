## PLAN: n8n JSON import, capability mapping, and AI-assisted gap filling

This plan covers two deliverables:
- Reusable business-logic package: `packages/@ui8kit/flow`
- Admin SPA: `apps/admin` (Vite + React + Tailwind + @ui8kit/core)

Inputs referenced:
- Example n8n project: `.project/Smart Supervisor Content Creation Assistant with Multi-Agent Monitoring.json`
- Brainstorm: `.project/brain-storm-task.md`
- Initial app proposal: `.project/cursor_workflow_start.md`

### High-level goals
- Import n8n JSON → parse → intermediate graph → validate against known schemas → highlight “yes/no” support.
- If unsupported: propose next steps via AI assistant: generate missing schemas/capabilities or suggest running via n8n bridge.
- Encapsulate reusable parsing/validation/compilation logic in `packages/@ui8kit/flow`.

### Design principles
- Minimal, explicit domain model (Zod-first) with strict types exported.
- Deterministic importer and validator: same input → same diagnostics.
- Clear, actionable diagnostics: id, level (info/warn/error), message, suggestion, source location.
- Fail closed: unknown nodes do not silently pass; they surface with guidance.
- Separation of concerns: package has zero UI; app renders state from package outputs.
- Extensibility: registry-driven capabilities; users can extend or override.

---

## 1) Package: packages/@ui8kit/flow

Scope: Core data models, n8n importer, validators (Zod), capability registry, compiler, helpers, and adapters. No UI.

### 1.1 Package structure
- `src/types/` — shared TypeScript types
- `src/schemas/` — Zod-based domain schemas
- `src/registry/` — capability registry (known agents/tools/nodes)
- `src/importers/n8n/` — n8n JSON → intermediate model
- `src/validation/` — graph & capability validators, diagnostics
- `src/compiler/` — compile validated graph to runner config
- `src/adapters/` — optional adapters (e.g., memory, providers)
- `src/index.ts` — public API surface

Scaffold commands (root):
- Create package skeleton: `mkdir -p packages/@ui8kit/flow/src/{types,schemas,registry,importers/n8n,validation,compiler,adapters} && echo "export * from './index'" > packages/@ui8kit/flow/src/index.ts`
- Add workspace dep in `apps/admin`: `cd apps/admin && bun add -D @ui8kit/flow@workspace:*`

### 1.2 Core types (TS + Zod)
- `ModelRef` { id, provider, model }
- `ToolSpec` { id, name, description, input: ZodType, output: ZodType }
- `AgentSpec` { id, role: enum, system?, modelRef, tools[] }
- `Edge` { from: { nodeId, port }, to: { nodeId, port } }
- `Flow` { models: ModelRef[], tools: ToolSpec[], agents: AgentSpec[], edges: Edge[] }

Actions:
- Implement Zod schemas aligning with brainstorm (`brain-storm-task.md`).
- Export TS types inferred from Zod.

### 1.3 Capability registry
- `registry/agents`: supervisor, observer, content, search, image, planning
- `registry/tools`: http/search/image/planning (with strict Zod I/O)
- `registry/models`: default OpenAI presets (configurable)
- Provide `getSupportedNodeKinds()` + metadata mapping.

### 1.4 n8n importer
- Input: n8n `.json` (as object/text)
- Parse nodes, connections, prompts, and parameters.
- Map to `Flow` primitives where recognizable; mark `unknown` kinds when unmapped.
- Include source location metadata for diagnostics (node ids, labels).

### 1.5 Validation and diagnostics
- Validate `Flow` with Zod; produce diagnostics array:
  - schema errors (shape mismatches)
  - capability support (known/unknown kinds)
  - model/tool references resolution
  - edge connectivity and port compatibility
- Provide `computeSupportMatrix(flow)` → { nodes: yes/no/maybe, reasons }.

Diagnostics shape (suggested):
```ts
type DiagnosticLevel = 'info' | 'warn' | 'error';
interface Diagnostic {
  id: string;            // stable id for grouping
  level: DiagnosticLevel;
  message: string;       // human-readable
  suggestion?: string;   // next step when applicable
  nodeId?: string;       // source node reference
  path?: string[];       // optional JSON path
}
```

### 1.6 Compiler
- `compile(flow)` → runner configuration for the app runtime.
- Limit scope: single-provider (OpenAI) first; pluggable provider interface for future.
- Respect guardrails hooks (pre-input, tool I/O, final output) as extension points.

RunnerConfig (minimal):
```ts
interface RunnerConfig {
  supervisor: string;          // agent id
  agents: Record<string, { modelRef: string; tools: string[]; system?: string }>;
  tools: Record<string, { input: unknown; output: unknown }>;
}
```

### 1.7 Adapters (iteration 2+)
- Memory adapters: in-memory, Supabase client-side shim (only if safe), server-side recommended.
- Provider switch: OpenAI first; adapter interface for others.

### 1.8 Public API
- `parseN8n(json): Flow` (with unknown markers)
- `validateFlow(flow): Diagnostics[]`
- `computeSupportMatrix(flow): SupportMatrix`
- `compile(flow): RunnerConfig`
- `registry` getters; Zod schemas

### 1.9 Testing and examples
- Add minimal unit tests for importer and validators (when test runner is introduced).
- Ship sample `examples/` with the provided n8n JSON (sanitized) and expected support matrix.

### 1.10 Packaging
- `package.json` with proper exports and types
- Semantic versioning starting at `0.1.0`

Hardening checklist:
- No side effects on import; pure functions.
- Inputs validated at boundaries; throw typed errors or return diagnostics, not generic any.
- Avoid catching without rethrow/logging; test malformed JSON paths.

Milestone M1 (Package ready):
- Importer + Zod schemas + registry + validation + support matrix + basic compiler

---

## 2) Admin app: apps/admin

Scope: UI for importing n8n JSON, viewing support matrix, running validation, and AI assistant to bridge gaps.

### 2.1 UI flows
- Import screen: drag & drop JSON → parse with `@ui8kit/flow` → show diagnostics.
- Capability view: list nodes with status badges (yes/no/maybe) and reasons.
- Details panel: for unsupported nodes, show why and options: generate schema, suggest n8n bridge.
- Assistant panel: prompt-based helper to generate missing schemas or migration hints.
- Run/Preview (later): run a compiled minimal flow if fully supported.

Error policy (UI):
- Never crash on malformed JSON; show parsing error diagnostic.
- Highlight unknown kinds with a single-click “Generate schema draft”.
- Provide copy-to-clipboard for diagnostics and schema proposals.

### 2.2 Pages/components
- `ImportPage` (dropzone + results)
- `DiagnosticsList` + `SupportBadge`
- `NodeDetails` (properties, reasons, actions)
- `AssistantPanel` (prompt + results)
- `SettingsPanel` (API keys, provider switch for dev only)

### 2.3 State and services
- `flowService`: wraps package API calls (parse/validate/support/compile)
- `assistantService`: sends prompts to AI (provider TBD) with guardrails
- Local state: React hooks; optional URL state for selected node

Telemetry (optional later):
- Anonymous counts of unknown kinds (for improving registry) with user opt-in.

### 2.4 Styling and theme
- Use `@ui8kit/core` components
- Tailwind v4 utilities with shadcn HSL tokens already configured

### 2.5 Env and security
- Dev only client-side keys; for prod, recommend server/edge proxies
- `.env.example`: `VITE_MODEL_PROVIDER`, `VITE_MODEL_NAME`, `VITE_OPENAI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Guidance:
- For production, never embed secrets in the client; provide proxy endpoints.

### 2.6 Assistant behaviors
- If node unknown: propose schema draft (input/output, role), show diff, allow save to registry (app-local first)
- If chain complex: suggest external execution through n8n with bridge instructions

Schema draft shape (example):
```ts
const Draft = {
  kind: 'agentTool',
  id: 'tool.search',
  input: { q: 'string' },
  output: { results: 'array' },
  rationale: 'Mapped from n8n httpRequest parameters',
};
```

Milestone M2 (App MVP ready):
- Import → diagnostics → support matrix UI → assistant suggestions (schema draft text) → export updated registry (local)

---

## 3) Integration plan (package + app)

### 3.1 Wire-up
- Add dependency: `apps/admin` → `packages/@ui8kit/flow`
- Use package APIs for parse/validate/matrix/compile
- Have a shared `registry` that app can augment at runtime (local volatile store)

### 3.2 Data flow
1) User drops `.json`
2) App calls `parseN8n` → `Flow`
3) App calls `validateFlow` → diagnostics
4) App calls `computeSupportMatrix` → render yes/no
5) If all supported → `compile` → ready-to-run preview (future)
6) If not supported → assistant suggests schema or n8n bridge

### 3.3 Persistence (later)
- Persist user-accepted schemas to a local file (download) or server API
- Optional Supabase-backed registry for logged-in users (future)

---

## 4) Milestones and timeline

- M1: Package core (importer, Zod schemas, registry, validation, support matrix, basic compiler)
- M2: App MVP (import UI, diagnostics, support matrix, assistant suggestions)
- M3: Provider/memory adapters (optional), preview runner, save/load user registry, Supabase integration (opt-in)

M0 (scaffold):
- Create package skeleton and wire workspace dependency.
- Hard-code tiny registry and parse minimal example to produce diagnostics.

---

## 5) Acceptance criteria

Package (`@ui8kit/flow`):
- Given provided n8n JSON, `parseN8n` returns `Flow` with unknown nodes correctly marked
- `validateFlow` returns structured diagnostics
- `computeSupportMatrix` yields per-node yes/no/maybe with reasons
- `compile` returns a config for supported minimal scenarios

Resilience checks:
- Invalid JSON → user-friendly error; no crash.
- Unknown node types → clear suggestions; assistant opens with context.

App (`apps/admin`):
- User can drop n8n JSON and immediately see a support matrix with badges
- Clicking a node shows reasons and suggested actions
- Assistant can draft a schema snippet for unknown node kinds or suggest n8n bridge
- Build and preview succeed with Vite + Bun

---

## 6) Task checklist

Package:
- Types and Zod schemas
- Capability registry (agents/tools/models)
- n8n importer
- Validation + diagnostics
- Support matrix API
- Compiler (minimal)
- Public API export

Admin app:
- Import UI + parsing
- Diagnostics and support matrix components
- Node details with actions
- Assistant integration (prompt → proposal)
- Settings panel and `.env.example`

DevOps:
- Add `bunx turbo run build` succeeds at root.
- `apps/admin` builds with no type errors.


