type OpenRouterMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type ChatOptions = {
  messages: OpenRouterMessage[]
  temperature?: number
  maxTokens?: number
  model?: string
}

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: {
    message?: string
  }
}

const DEFAULT_MODEL = 'openai/gpt-4o-mini'

export async function openRouterChat({
  messages,
  temperature = 0.2,
  maxTokens = 4096,
  model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
}: ChatOptions): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }

  if (process.env.OPENROUTER_SITE_URL) {
    headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL
  }

  if (process.env.OPENROUTER_APP_NAME) {
    headers['X-Title'] = process.env.OPENROUTER_APP_NAME
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
  })

  const json = (await res.json().catch(() => ({}))) as OpenRouterResponse

  if (!res.ok) {
    throw new Error(json.error?.message || `OpenRouter request failed: ${res.status}`)
  }

  const content = json.choices?.[0]?.message?.content
  if (!content) throw new Error('OpenRouter returned an empty response')
  return content
}

export function parseJsonObject<T>(raw: string): T {
  const trimmed = raw.trim()
  const jsonText = trimmed.match(/\{[\s\S]*\}/)?.[0] ?? trimmed
  return JSON.parse(jsonText) as T
}
