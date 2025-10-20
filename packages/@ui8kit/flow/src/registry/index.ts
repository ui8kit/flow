export type KnownAgentRole = 'supervisor' | 'observer' | 'content' | 'search' | 'image' | 'planning';

export function getSupportedNodeKinds(): string[] {
  return [
    '@n8n/n8n-nodes-langchain.agent',
    '@n8n/n8n-nodes-langchain.agentTool',
    '@n8n/n8n-nodes-langchain.lmChatOpenAi',
    'n8n-nodes-base.httpRequestTool',
  ];
}

export const defaultModelPresets = {
  openai: ['gpt-4.1-mini'],
};

