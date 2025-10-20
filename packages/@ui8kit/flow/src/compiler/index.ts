import type { RunnerConfig } from '../types/index.js';

export function compile(): RunnerConfig {
  return {
    supervisor: 'supervisor',
    agents: {},
    tools: {},
  };
}

