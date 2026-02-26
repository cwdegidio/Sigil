import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { intro, outro, text, select, cancel, isCancel, note } from '@clack/prompts'
import { getContext } from './context.js'
import { addAgent } from './agent.js'

// ─── sigil init ───────────────────────────────────────────────────────────────

export type InitResult = { created: string[]; skipped: string[] }

export function init(projectName: string, outputDir: string): InitResult {
  const created: string[] = []
  const skipped: string[] = []

  function writeFile(relativePath: string, content: string): void {
    const fullPath = join(outputDir, relativePath)
    if (existsSync(fullPath)) {
      skipped.push(relativePath)
    } else {
      writeFileSync(fullPath, content, 'utf8')
      created.push(relativePath)
    }
  }

  function makeDir(relativePath: string): void {
    const fullPath = join(outputDir, relativePath)
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true })
      created.push(relativePath + '/')
    }
  }

  writeFile('SIGIL-AUTHOR.md', getContext('author'))
  writeFile('SIGIL-CONSUMER.md', getContext('consumer'))

  const manifest = [
    `[project]`,
    `name = "${projectName}"`,
    `doctrine = "${projectName}.doctrine"`,
    ``,
    `[paths]`,
    `charters = "charters/"`,
    `sigils = "sigils/"`,
  ].join('\n') + '\n'

  writeFile('sigil.toml', manifest)
  makeDir('charters')
  makeDir('sigils')

  return { created, skipped }
}

export function printInitResult(projectName: string, result: InitResult): void {
  if (result.created.length > 0) {
    console.log(`\nInitialized Sigil project '${projectName}'.\n`)
    console.log('Created:')
    for (const f of result.created) console.log(`  ${f}`)
  }
  if (result.skipped.length > 0) {
    console.log('\nSkipped (already exist):')
    for (const f of result.skipped) console.log(`  ${f}`)
  }
  console.log(`
Next steps:
  sigil agent add <agent>    Add agent-specific scaffolding (e.g. claude-code)
  sigil validate sigil.toml  Validate the corpus once spec files are written`)
}

export function printAgentResult(agentName: string, result: { created: string[]; skipped: string[]; appended: string[] }): void {
  if (result.created.length > 0) {
    console.log(`\nAdded ${agentName} scaffolding.\n`)
    console.log('Created:')
    for (const f of result.created) console.log(`  ${f}`)
  }
  if (result.appended.length > 0) {
    console.log('\nAppended to:')
    for (const f of result.appended) console.log(`  ${f}`)
  }
  if (result.skipped.length > 0) {
    console.log('\nSkipped (already exist):')
    for (const f of result.skipped) console.log(`  ${f}`)
  }
  if (agentName === 'claude-code') {
    console.log(`
Use /author to enter spec authoring mode.
Use /consumer to enter implementation mode.`)
  }
}

// ─── Interactive mode (sigil init with no args) ───────────────────────────────

export async function initInteractive(outputDir: string): Promise<void> {
  intro('Sigil — New Project')

  const projectName = await text({
    message: 'Project name',
    placeholder: 'MyProject',
    validate: (value) => {
      if (!value || !value.trim()) return 'Project name is required.'
      if (!/^[A-Z][A-Za-z0-9]+$/.test(value.trim()))
        return 'Must be CapitalizedCamelCase (e.g. PetHealth, ECommerce).'
    },
  })

  if (isCancel(projectName)) {
    cancel('Cancelled.')
    process.exit(0)
  }

  const agentChoice = await select({
    message: 'Agent scaffolding',
    options: [
      { value: 'none', label: 'None' },
      { value: 'claude-code', label: 'Claude Code', hint: '.claude/commands/author.md + consumer.md' },
    ],
  })

  if (isCancel(agentChoice)) {
    cancel('Cancelled.')
    process.exit(0)
  }

  const name = (projectName as string).trim()
  const initResult = init(name, outputDir)
  const agentResult = agentChoice !== 'none' ? await addAgent(agentChoice as string, outputDir) : null

  const allCreated = [...initResult.created, ...(agentResult?.created ?? [])]
  const allAppended = [...(agentResult?.appended ?? [])]
  const allSkipped = [...initResult.skipped, ...(agentResult?.skipped ?? [])]

  const lines: string[] = []
  if (allCreated.length > 0) {
    lines.push('Created:')
    for (const f of allCreated) lines.push(`  ${f}`)
  }
  if (allAppended.length > 0) {
    if (lines.length > 0) lines.push('')
    lines.push('Appended to:')
    for (const f of allAppended) lines.push(`  ${f}`)
  }
  if (allSkipped.length > 0) {
    if (lines.length > 0) lines.push('')
    lines.push('Skipped (already exist):')
    for (const f of allSkipped) lines.push(`  ${f}`)
  }

  if (lines.length > 0) {
    note(lines.join('\n'), 'Files')
  }

  outro(`Project '${name}' ready.`)
}
