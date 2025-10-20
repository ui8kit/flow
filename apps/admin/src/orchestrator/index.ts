import { OpenAI } from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

export interface OrchestratorMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export class Orchestrator {
  private client: OpenAI
  private model: string

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
    this.model = model
  }

  async chat(messages: OrchestratorMessage[]): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as ChatCompletionMessageParam[]
    })
    return res.choices?.[0]?.message?.content || ''
  }

  async runSupervisorFlow(supervisorSystem: string | undefined, capabilities: string[], history: OrchestratorMessage[], userInput: string): Promise<string> {
    const sys = [
      supervisorSystem || 'You are a supervisor that coordinates helper agents.',
      'Workflow:',
      '- First, act as an Observer: if the user intends to create content, respond with: CONTENT_INTENT_DETECTED: <brief topic>. Otherwise: NO_CONTENT_INTENT.',
      '- If NO_CONTENT_INTENT: answer the user helpfully and concisely.',
      `- If CONTENT_INTENT_DETECTED: greet the user and list available actions: ${capabilities.join(', ')}. Ask which to proceed with. Do not execute tools.`,
      '- Keep responses short and actionable.'
    ].join('\n')

    const messages: OrchestratorMessage[] = [
      { role: 'system', content: sys },
      ...history,
      { role: 'user', content: userInput }
    ]
    return this.chat(messages)
  }
}


