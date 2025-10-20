import { z } from 'zod';

export const ModelRefSchema = z.object({
  id: z.string(),
  provider: z.literal('openai'),
  model: z.string(),
});

export const ToolSpecSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  // input/output are provider-specific; capture as unknown initially
  input: z.unknown().optional(),
  output: z.unknown().optional(),
});

export const AgentSpecSchema = z.object({
  id: z.string(),
  role: z.enum(['supervisor','observer','content','search','image','planning']),
  system: z.string().optional(),
  modelRef: z.string(),
  tools: z.array(z.string()).default([]),
});

export const EdgeSchema = z.object({
  from: z.object({ nodeId: z.string(), port: z.string().default('main') }),
  to: z.object({ nodeId: z.string(), port: z.string().default('main') }),
});

export const FlowSchema = z.object({
  models: z.array(ModelRefSchema),
  tools: z.array(ToolSpecSchema),
  agents: z.array(AgentSpecSchema),
  edges: z.array(EdgeSchema),
});

export type Flow = z.infer<typeof FlowSchema>;

