'use client'

import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

export type HashtagInputProps = {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  className?: string
}

export function HashtagInput({
  value,
  onChange,
  placeholder = 'Type and press Enter…',
  className,
}: HashtagInputProps) {
  const [draft, setDraft] = useState('')

  function commit(raw: string) {
    const tags = raw
      .split(/[,\n]/)
      .map((t) => t.trim().replace(/^#+/, ''))
      .filter(Boolean)
      .map((t) => `#${t}`)
    if (tags.length === 0) return
    const next = Array.from(new Set([...value, ...tags]))
    onChange(next)
    setDraft('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (draft.trim()) commit(draft)
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  function remove(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  return (
    <div className={cn('space-y-2', className)}>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700"
            >
              {tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                className="rounded-sm hover:bg-violet-200/70"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => draft.trim() && commit(draft)}
        placeholder={placeholder}
      />
    </div>
  )
}
