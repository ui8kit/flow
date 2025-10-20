export type DiagnosticLevel = 'info' | 'warn' | 'error';

export interface Diagnostic {
  id: string;
  level: DiagnosticLevel;
  message: string;
  suggestion?: string;
  nodeId?: string;
  path?: string[];
}

export interface ModelRef {
  id: string;
  provider: 'openai';
  model: string;
}

export interface ToolSpec {
  id: string;
  name: string;
  description: string;
  // concrete zod instances will be reflected in runtime schema modules
}

export interface AgentSpec {
  id: string;
  role: 'supervisor' | 'observer' | 'content' | 'search' | 'image' | 'planning';
  system?: string;
  modelRef: string;
  tools: string[];
}

export interface EdgePortRef {
  nodeId: string;
  port: string;
}

export interface Edge {
  from: EdgePortRef;
  to: EdgePortRef;
}

export interface SupportMatrixItem {
  nodeId: string;
  status: 'yes' | 'no' | 'maybe';
  reasons?: string[];
}

export interface SupportMatrix {
  nodes: SupportMatrixItem[];
}

export interface RunnerConfig {
  supervisor: string;
  agents: Record<string, { modelRef: string; tools: string[]; system?: string }>;
  tools: Record<string, { input: unknown; output: unknown }>;
}

