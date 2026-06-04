import { NextResponse, type NextRequest } from 'next/server'
import { requireSuperadminAPI } from '@/lib/admin/guard'
import mammoth from 'mammoth'

// POST /api/admin/scripts/parse-file
// Accepts multipart form: field "file" — .txt, .md, or .docx
// Returns { text: string }
export async function POST(req: NextRequest) {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'file field required' }, { status: 400 })
  }

  const name = file instanceof File ? file.name.toLowerCase() : ''

  if (!name.endsWith('.txt') && !name.endsWith('.md') && !name.endsWith('.docx')) {
    return NextResponse.json(
      { error: 'Only .txt, .md, and .docx files are supported' },
      { status: 415 }
    )
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 413 })
  }

  try {
    if (name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      return NextResponse.json({ text: result.value.trim() })
    }

    // .txt / .md — plain text
    const text = await file.text()
    return NextResponse.json({ text: text.trim() })
  } catch {
    return NextResponse.json(
      { error: 'Could not parse file. Try copying and pasting the text instead.' },
      { status: 422 }
    )
  }
}
