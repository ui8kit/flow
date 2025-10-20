import { FlowSchema } from '../schemas/index.js';
import type { Diagnostic, SupportMatrix } from '../types/index.js';

export function validateFlow(flow: unknown): { ok: boolean; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];
  const parsed = FlowSchema.safeParse(flow);
  if (!parsed.success) {
    diagnostics.push({
      id: 'flow.schema.invalid',
      level: 'error',
      message: 'Flow does not match schema',
      suggestion: 'Check required fields: models, tools, agents, edges',
    });
    return { ok: false, diagnostics };
  }
  return { ok: true, diagnostics };
}

export function computeSupportMatrix(): SupportMatrix {
  return { nodes: [] };
}

