#!/usr/bin/env node
import { buildAgents } from './index.js';

async function main() {
  const sourceDir = process.argv[2] || '.project';
  const outDir = process.argv[3] || 'apps/admin/src/agents';
  await buildAgents({ sourceDir, outDir });
  // eslint-disable-next-line no-console
  console.log(`Built agents from ${sourceDir} -> ${outDir}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

