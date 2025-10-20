export interface AgentConfigFile {
  name: string;
  role: 'supervisor' | 'observer' | 'content' | 'search' | 'image' | 'planning';
  model: string;
}

export interface AgentSchemaFile {
  input?: unknown;
  output?: unknown;
}

export interface BuildOptions {
  sourceDir: string; // path to folder with *.json n8n workflows
  outDir: string;    // path to apps/admin/src/agents
}

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseN8n } from '@ui8kit/flow';

export async function buildAgents(opts: BuildOptions): Promise<void> {
  const entries = await fs.readdir(opts.sourceDir);
  for (const entry of entries) {
    if (!entry.endsWith('.json')) continue;
    const full = path.join(opts.sourceDir, entry);
    const raw = await fs.readFile(full, 'utf8');
    const json = JSON.parse(raw);
    // derive folder name from workflow id
    const id = json.id || path.parse(entry).name;
    const agentDir = path.join(opts.outDir, String(id));
    await fs.mkdir(agentDir, { recursive: true });

    // build flow to validate
    const flow = parseN8n(json);

    // emit config.ts from real flow
    const agentsCfg = flow.agents.map((a: any) => ({
      id: a.id,
      name: getNodeNameById(json, a.id),
      role: a.role,
      modelRef: a.modelRef,
      tools: a.tools,
      system: a.system,
    }));
    const modelsCfg = flow.models.map((m: any) => ({ id: m.id, provider: m.provider, model: m.model }));
    const toolsCfg = flow.tools.map((t: any) => ({ id: t.id, name: t.name, description: t.description }));
    const configObj = {
      id,
      name: json.name,
      models: modelsCfg,
      agents: agentsCfg,
      tools: toolsCfg,
    };
    const configTs = `export const flowConfig = ${JSON.stringify(configObj, null, 2)} as const;\n`;

    // emit schema.ts with zod
    const toolSchemas: Record<string, any> = {};
    for (const t of flow.tools) {
      const node = getNodeById(json, t.id);
      if (!node) continue;
      const inputShape = buildInputShapeFromNode(node);
      toolSchemas[t.id] = { input: inputShape, output: {} };
    }

    // optional mapping file overrides
    const baseName = path.parse(entry).name;
    const mapPath = path.join(opts.sourceDir, `${baseName}.map.json`);
    const mapping = await readOptionalJson(mapPath);
    if (mapping) {
      const inputs = (mapping as any).inputs || {};
      const outputs = (mapping as any).outputs || {};
      for (const [toolId, ov] of Object.entries(inputs as Record<string, unknown>)) {
        const bag = toolSchemas[toolId];
        if (!bag) continue;
        const overrides = ov as Record<string, string>;
        bag.input = { ...bag.input, ...overrides };
      }
      for (const [toolId, out] of Object.entries(outputs as Record<string, unknown>)) {
        const bag = toolSchemas[toolId];
        if (!bag) continue;
        const outShape = out as Record<string, string>;
        bag.output = { ...(bag.output || {}), ...outShape };
      }
    }

    const schemaTs = buildSchemaTs(toolSchemas);

    await fs.writeFile(path.join(agentDir, 'config.ts'), configTs, 'utf8');
    await fs.writeFile(path.join(agentDir, 'schema.ts'), schemaTs, 'utf8');
    await fs.writeFile(path.join(agentDir, 'index.ts'), "export * from './config';\nexport * from './schema';\n", 'utf8');
  }
}

async function readOptionalJson(p: string): Promise<unknown | null> {
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getNodeNameById(json: any, id: string): string | undefined {
  return json?.nodes?.find((n: any) => n.id === id)?.name;
}

function getNodeById(json: any, id: string): any | undefined {
  return json?.nodes?.find((n: any) => n.id === id);
}

function buildInputShapeFromNode(node: any): Record<string, string> {
  // AgentTool: expect 'text' input
  if (node.type === '@n8n/n8n-nodes-langchain.agentTool') {
    const shape: Record<string, string> = {};
    if (typeof node.parameters?.text === 'string' || node.parameters?.text) {
      shape.text = 'string';
    }
    return shape;
  }
  // HTTP Request Tool: map query/body parameters
  if (node.type === 'n8n-nodes-base.httpRequestTool') {
    const shape: Record<string, string> = {};
    if (typeof node.parameters?.url === 'string') shape.url = 'string';
    if (typeof node.parameters?.method === 'string') shape.method = 'string';
    if (typeof node.parameters?.sendQuery === 'boolean') shape.sendQuery = 'boolean';
    if (typeof node.parameters?.sendBody === 'boolean') shape.sendBody = 'boolean';
    const qp = node.parameters?.queryParameters?.parameters;
    if (Array.isArray(qp)) {
      for (const p of qp) {
        if (typeof p?.name === 'string') shape[p.name] = 'string';
      }
    }
    const bp = node.parameters?.bodyParameters?.parameters;
    if (Array.isArray(bp)) {
      for (const p of bp) {
        if (typeof p?.name === 'string') shape[p.name] = 'string';
      }
    }
    return shape;
  }
  // default
  return {};
}

function safeName(id: string): string {
  let name = id.replace(/[^a-zA-Z0-9_]/g, '_');
  if (!/^[A-Za-z_]/.test(name)) name = '_' + name;
  return name;
}

function buildSchemaTs(toolSchemas: Record<string, { input: Record<string, string> }>): string {
  let out = `import { z } from 'zod';\n\n`;
  for (const [toolId, s] of Object.entries(toolSchemas)) {
    const inVar = `${safeName(toolId)}Input`;
    const entries = Object.entries((s as any).input || {});
    const props = entries.map(([key, type]) => {
      const zExpr = toZodExpr(type as string);
      return `  ${JSON.stringify(key)}: ${zExpr}`;
    }).join(',\n');
    out += `export const ${inVar} = z.object({${props ? '\n' + props + '\n' : ''}});\n`;
    out += `export type ${inVar} = z.infer<typeof ${inVar}>;\n`;

    const outEntries = Object.entries((s as any).output || {});
    if (outEntries.length) {
      const outProps = outEntries.map(([key, type]) => `  ${JSON.stringify(key)}: ${toZodExpr(type as string)}`).join(',\n');
      const outVar = `${safeName(toolId)}Output`;
      out += `export const ${outVar} = z.object({\n${outProps}\n});\n`;
      out += `export type ${outVar} = z.infer<typeof ${outVar}>;\n`;
    }
    out += `\n`;
  }
  return out;
}

function toZodExpr(type: string): string {
  switch (type) {
    case 'string':
      return 'z.string()';
    case 'number':
      return 'z.number()';
    case 'boolean':
      return 'z.boolean()';
    case 'array':
      return 'z.array(z.unknown())';
    case 'object':
      return 'z.record(z.unknown())';
    default:
      return 'z.unknown()';
  }
}

