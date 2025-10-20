import { useEffect, useMemo, useRef, useState } from 'react'
import { Block, Stack, Group, Title, Text, Box, Button } from '@ui8kit/core'
import { flowConfig } from '@/agents/zxTP2RwfuBz1lXA6/config'
import { Orchestrator } from '@/orchestrator'

type Message = { role: 'user' | 'assistant'; content: string }

const STORAGE_KEY = 'ui8kit.chat.messages'

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
  })
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  const supervisor = useMemo(() => flowConfig.agents.find(a => a.role === 'supervisor') || flowConfig.agents[0], [])

  async function send() {
    const text = input.trim()
    if (!text) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    const reply = await callOrchestrator(text)
    setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    inputRef.current?.focus()
  }

  return (
    <Block w="full" component="section">
      <Stack gap="md">
        <Title order={3}>Chat</Title>
        <Box bg="card" p="md" rounded="md" style={{ height: 420, overflowY: 'auto' }}>
          <Stack gap="sm">
            {messages.map((m, i) => (
              <Box key={i} p="sm" bg={m.role === 'user' ? 'accent' : 'muted'} rounded="sm">
                <Text c="foreground">{m.content}</Text>
              </Box>
            ))}
          </Stack>
        </Box>
        <Group gap="sm">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="Type message..."
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid hsl(0 0% 87.8431%)' }}
          />
          <Button onClick={send}>Send</Button>
        </Group>
        <Text size="xs" c="muted">Supervisor: {supervisor?.name ?? supervisor?.id}</Text>
      </Stack>
    </Block>
  )
}

async function callOrchestrator(prompt: string): Promise<string> {
  const apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY
  const model = (import.meta as any).env?.VITE_MODEL_NAME || 'gpt-4.1-mini'
  if (!apiKey) return 'Please set VITE_OPENAI_API_KEY in your .env'
  const orchestrator = new Orchestrator(apiKey, model)
  return await orchestrator.chat([
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: prompt }
  ])
}


