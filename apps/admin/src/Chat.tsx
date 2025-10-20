import { useEffect, useMemo, useRef, useState } from 'react'
import { Block, Stack, Group, Title, Text, Box, Button, Icon } from '@ui8kit/core'
import { Input } from '@ui8kit/form'
import { flowConfig } from '@/agents/zxTP2RwfuBz1lXA6/config'
import { Orchestrator } from '@/orchestrator'
import { CopyIcon, SendIcon } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }

const STORAGE_KEY = 'ui8kit.chat.messages'

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentAgent, setCurrentAgent] = useState<string>('Supervisor Agent')
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesRef = useRef<Message[]>([])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    messagesRef.current = messages
  }, [messages])

  const supervisor = useMemo(() => flowConfig.agents.find(a => a.role === 'supervisor') || flowConfig.agents[0], [])
  const capabilities = useMemo(() => flowConfig.tools
    .map(t => t.name)
    .filter(Boolean)
    .filter(n => n !== 'Chat Trigger' && n !== 'Conversation Memory'), [])

  const callSupervisor = async (prompt: string): Promise<string> => {
    const apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY
    const model = (import.meta as any).env?.VITE_MODEL_NAME || 'gpt-4.1-mini'
    if (!apiKey) return 'Please set VITE_OPENAI_API_KEY in your .env'
    const orchestrator = new Orchestrator(apiKey, model)
    const history = messagesRef.current.slice(-8) as any
    return await orchestrator.runSupervisorFlow(supervisor?.system, capabilities as string[], history as any, prompt)
  }

  async function send() {
    const text = input.trim()
    if (!text) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    // update current agent if user selected one of known tools
    const matchedTool = (flowConfig.tools || []).find(t => (t.name || '').toLowerCase() === text.toLowerCase())
    if (matchedTool) setCurrentAgent(matchedTool.name)
    else setCurrentAgent('Supervisor Agent')
    setLoading(true)
    const reply = await callSupervisor(text)
    setLoading(false)
    setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    inputRef.current?.focus()
  }

  function copyToClipboard(text: string) {
    try {
      navigator.clipboard.writeText(text)
    } catch {}
  }

  return (
    <Block w="full" component="section">
      <Stack gap="md">
        <Title order={3}>Chat</Title>
        <Text size="sm" c="muted">Agent: {currentAgent}</Text>
        <Box bg="card" p="md" rounded="md" style={{ height: 420, overflowY: 'auto' }}>
          <Stack gap="sm">
            {messages.map((m, i) => (
              <Box position="relative" key={i} p="none" bg={m.role === 'user' ? 'accent' : 'muted'} rounded="sm">
                <Group p="sm" justify="between" align="start" gap="sm">
                  <Text c="foreground" style={{ whiteSpace: 'pre-wrap' }}>{m.content}</Text>
                </Group>
                  <Box position="absolute" style={{ bottom: 0, right: '-.5rem' }}>
                    <Button variant="link" size="sm" onClick={() => copyToClipboard(m.content)}><Icon lucideIcon={CopyIcon} /></Button>
                  </Box>
              </Box>
            ))}
          </Stack>
        </Box>
        <Group gap="sm">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="Type message..."
            disabled={loading}
            data-class="input"
            autoComplete="off"
            className="text-secondary-foreground text-sm md:text-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
          />
          <Button variant="ghost" onClick={send} disabled={loading}><Icon lucideIcon={SendIcon} /></Button>
        </Group>
        <Text size="xs" c="muted">Supervisor: {supervisor?.name ?? supervisor?.id}</Text>
      </Stack>
    </Block>
  )
}

