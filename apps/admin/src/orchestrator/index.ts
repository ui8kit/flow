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
}


