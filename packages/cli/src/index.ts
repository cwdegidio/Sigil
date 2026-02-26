#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadManifest, ManifestError } from './manifest.js'
import { validate } from './validator.js'
import { report } from './reporter.js'
import { getContext, type Role } from './context.js'
import { init, initInteractive, printInitResult, printAgentResult } from './init.js'
import { addAgent } from './agent.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const { version } = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'))

// ─── CLI entry point ──────────────────────────────────────────────────────────

const args = process.argv.slice(2)

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  printUsage()
  process.exit(0)
}

if (args[0] === '--version' || args[0] === '-v') {
  console.log(version)
  process.exit(0)
}

const [command] = args

if (command === 'init') {
  const projectName = args[1]
  if (!projectName) {
    await initInteractive(process.cwd())
  } else {
    const result = init(projectName, process.cwd())
    printInitResult(projectName, result)
  }
  process.exit(0)
}

if (command === 'agent') {
  const subcommand = args[1]
  if (subcommand !== 'add') {
    console.error(`Unknown subcommand: 'agent ${subcommand ?? ''}'. Did you mean: sigil agent add <agent-name>`)
    printUsage()
    process.exit(1)
  }
  const agentName = args[2]
  if (!agentName) {
    console.error(`Missing argument: <agent-name>`)
    printUsage()
    process.exit(1)
  }
  const result = await addAgent(agentName, process.cwd())
  printAgentResult(agentName, result)
  process.exit(0)
}

if (command === 'context') {
  const roleFlag = args.indexOf('--role')
  if (roleFlag === -1 || !args[roleFlag + 1]) {
    console.error(`Missing argument: --role <author|consumer>`)
    printUsage()
    process.exit(1)
  }
  const role = args[roleFlag + 1]
  if (role !== 'author' && role !== 'consumer') {
    console.error(`Invalid role: '${role}'. Must be 'author' or 'consumer'.`)
    printUsage()
    process.exit(1)
  }
  process.stdout.write(getContext(role as Role) + '\n')
  process.exit(0)
}

if (command !== 'validate') {
  console.error(`Unknown command: '${command}'`)
  printUsage()
  process.exit(1)
}

const manifestPath = args[1]

if (!manifestPath) {
  console.error(`Missing argument: <manifest-path>`)
  printUsage()
  process.exit(1)
}

let manifest
try {
  manifest = loadManifest(manifestPath)
} catch (e) {
  if (e instanceof ManifestError) {
    console.error(`Manifest error: ${e.message}`)
    process.exit(1)
  }
  throw e
}

const { errors } = validate(manifest)
const exitCode = report(errors)
process.exit(exitCode)

function printUsage(): void {
  console.log(`
sigil — Sigil language reference validator

Usage:
  sigil --version
  sigil init <project-name>
  sigil agent add <agent-name>
  sigil validate <path-to-manifest>
  sigil context --role <author|consumer>

Commands:
  init      Bootstrap a new Sigil project (platform-agnostic artifacts)
  agent     Manage agent-specific scaffolding
  validate  Validate a Sigil corpus against the manifest
  context   Print AI context for the given role to stdout

Arguments:
  init      <project-name>             Name of the project (used in sigil.toml and doctrine filename)
  agent     add <agent-name>           Add scaffolding for the given agent (supported: claude-code)
  validate  <path-to-manifest>         Path to a sigil.toml manifest file
  context   --role author              Context for writing .sigil/.charter/.doctrine files
            --role consumer            Context for implementing from spec files

Output:
  init      Creates SIGIL-AUTHOR.md, SIGIL-CONSUMER.md, sigil.toml, charters/, sigils/
  agent     Creates agent-specific command files in the project root
  validate  Compiler-style diagnostics on stderr. Exit code 0 = clean, 1 = errors.
  context   Markdown context artifact on stdout. Redirect to SIGIL-AUTHOR.md or
            SIGIL-CONSUMER.md in your project root.

Examples:
  sigil init PetHealth
  sigil agent add claude-code
  sigil validate ./sigil.toml
  sigil context --role author > SIGIL-AUTHOR.md
  sigil context --role consumer > SIGIL-CONSUMER.md
`.trim())
}
