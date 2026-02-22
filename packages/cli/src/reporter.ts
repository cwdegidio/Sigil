import { SigilError } from './types.js'

// ─── Reporter ─────────────────────────────────────────────────────────────────
//
// Formats and outputs validation results.
//
// Output format: file:line:col — [PARSE|VALIDATION]: message
//
// Errors are sorted by file path, then line, then col.
// Exit code is returned: 0 = clean, 1 = errors present.
// ─────────────────────────────────────────────────────────────────────────────

export function report(errors: SigilError[]): number {
  if (errors.length === 0) {
    console.log('No errors found.')
    return 0
  }

  const sorted = [...errors].sort((a, b) => {
    const fileCmp = a.pos.file.localeCompare(b.pos.file)
    if (fileCmp !== 0) return fileCmp
    if (a.pos.line !== b.pos.line) return a.pos.line - b.pos.line
    return a.pos.col - b.pos.col
  })

  for (const err of sorted) {
    const { file, line, col } = err.pos
    console.error(`${file}:${line}:${col} \u2014 [${err.category}]: ${err.message}`)
  }

  const parseCount = errors.filter(e => e.category === 'PARSE').length
  const validationCount = errors.filter(e => e.category === 'VALIDATION').length
  const parts: string[] = []
  if (parseCount > 0) parts.push(`${parseCount} parse error${parseCount === 1 ? '' : 's'}`)
  if (validationCount > 0) parts.push(`${validationCount} validation error${validationCount === 1 ? '' : 's'}`)
  console.error(`\n${parts.join(', ')} found.`)

  return 1
}
