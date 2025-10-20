import { z } from 'zod';
import type { Flow } from '../../schemas/index.js';
import { FlowSchema } from '../../schemas/index.js';
import type { AgentSpec, ModelRef, ToolSpec } from '../../types/index.js';

export const N8nNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  typeVersion: z.number(),
  position: z.tuple([z.number(), z.number()]),
  parameters: z.record(z.any()).default({}),
  credentials: z.record(z.any()).optional(),
});

export const N8nConnectionsSchema = z.record(z.any());

export const N8nWorkflowSchema = z.object({
  name: z.string(),
  nodes: z.array(N8nNodeSchema),
  connections: N8nConnectionsSchema,
  pinData: z.record(z.any()).optional().default({}),
  active: z.boolean().optional(),
  settings: z.record(z.any()).optional(),
  versionId: z.string().optional(),
  meta: z.record(z.any()).optional(),
  id: z.string(),
  tags: z.array(z.any()).optional().default([]),
});

export function validateN8nWorkflow(json: unknown) {
  return N8nWorkflowSchema.safeParse(json);
}

export function parseN8n(json: unknown): Flow {
  const parsed = validateN8nWorkflow(json);
  if (!parsed.success) {
    throw new Error('Invalid n8n JSON: ' + parsed.error.message);
  }
  const wf = parsed.data;

  const nameToId = new Map<string,string>();
  const idToType = new Map<string,string>();
  const nodeById = new Map<string, z.infer<typeof N8nNodeSchema>>();
  for (const node of wf.nodes) {
    nameToId.set(node.name, node.id);
    idToType.set(node.id, node.type);
    nodeById.set(node.id, node);
  }

  const models: ModelRef[] = [];
  const agents: AgentSpec[] = [];
  const tools: ToolSpec[] = [];

  // First pass: collect nodes
  for (const node of wf.nodes) {
    if (node.type === '@n8n/n8n-nodes-langchain.agent') {
      const role = inferRoleFromName(node.name);
      agents.push({
        id: node.id,
        role,
        system: getSystemMessage(node.parameters),
        modelRef: 'openai-default',
        tools: [],
      });
    } else if (node.type === '@n8n/n8n-nodes-langchain.lmChatOpenAi') {
      const modelName = getModelName(node.parameters) || 'gpt-4.1-mini';
      models.push({ id: node.id, provider: 'openai', model: modelName });
    } else if (
      node.type === '@n8n/n8n-nodes-langchain.agentTool' ||
      node.type === 'n8n-nodes-base.httpRequestTool' ||
      node.type === '@n8n/n8n-nodes-langchain.memoryBufferWindow' ||
      node.type === '@n8n/n8n-nodes-langchain.chatTrigger'
    ) {
      tools.push({
        id: node.id,
        name: node.name,
        description: getToolDescription(node.parameters),
      });
    }
  }

  // Ensure at least one default model exists
  if (!models.length) {
    models.push({ id: 'openai-default', provider: 'openai', model: 'gpt-4.1-mini' });
  }

  // Build edges from connections
  const edges: Flow['edges'] = [];
  for (const [fromName, connsByPort] of Object.entries(wf.connections)) {
    const fromId = nameToId.get(fromName);
    if (!fromId) continue;
    for (const [portKey, lists] of Object.entries(connsByPort as Record<string, unknown>)) {
      // lists is an array of arrays of connection objects
      if (!Array.isArray(lists)) continue;
      for (const arr of lists as any[]) {
        if (!Array.isArray(arr)) continue;
        for (const conn of arr) {
          const toName = conn?.node as string | undefined;
          const type = (conn?.type as string) || portKey;
          if (!toName) continue;
          const toId = nameToId.get(toName);
          if (!toId) continue;
          edges.push({ from: { nodeId: fromId, port: type }, to: { nodeId: toId, port: type } });
        }
      }
    }
  }

  // Resolve agent modelRef and tools via edges
  const modelIds = new Set(models.map(m => m.id));
  const toolIds = new Set(tools.map(t => t.id));
  for (const agent of agents) {
    const inbound = edges.filter(e => e.to.nodeId === agent.id);
    const modelEdge = inbound.find(e => e.from && e.from.port.includes('ai_languageModel') && modelIds.has(e.from.nodeId));
    if (modelEdge) {
      agent.modelRef = modelEdge.from.nodeId;
    }
    const toolEdges = inbound.filter(e => {
      if (!e.from) return false;
      if (!toolIds.has(e.from.nodeId)) return false;
      // Consider any incoming non-languageModel port as a potential tool linkage
      return !e.from.port.includes('ai_languageModel');
    });
    agent.tools = toolEdges.map(e => e.from.nodeId);
  }

  const flow: Flow = { models, tools, agents, edges };
  const flowParsed = FlowSchema.safeParse(flow);
  if (!flowParsed.success) {
    throw new Error('Internal Flow invalid: ' + flowParsed.error.message);
  }
  return flowParsed.data;
}

function inferRoleFromName(name: string): AgentSpec['role'] {
  const n = name.toLowerCase();
  if (n.includes('supervisor')) return 'supervisor';
  if (n.includes('observer')) return 'observer';
  if (n.includes('planning')) return 'planning';
  if (n.includes('image')) return 'image';
  if (n.includes('search')) return 'search';
  return 'content';
}

function getSystemMessage(parameters: Record<string, unknown>): string | undefined {
  const options = (parameters as any)?.options;
  if (options && typeof options.systemMessage === 'string') {
    return options.systemMessage;
  }
  return undefined;
}

function getToolDescription(parameters: Record<string, unknown>): string {
  const desc = (parameters as any)?.toolDescription;
  if (typeof desc === 'string' && desc.length > 0) return desc;
  return 'Tool generated from n8n node';
}

function getModelName(parameters: Record<string, unknown>): string | undefined {
  const model = (parameters as any)?.model;
  const value = model?.value ?? model?.model ?? model;
  if (typeof value === 'string') return value;
  return undefined;
}

