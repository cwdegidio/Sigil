#!/usr/bin/env node
import { loadManifest, ManifestError } from './manifest.js'
import { validate } from './validator.js'
import { report } from './reporter.js'

// ─── CLI entry point ──────────────────────────────────────────────────────────

const args = process.argv.slice(2)

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  printUsage()
  process.exit(0)
}

const [command, manifestPath] = args

if (command !== 'validate') {
  console.error(`Unknown command: '${command}'`)
  printUsage()
  process.exit(1)
}

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
  sigil validate <path-to-manifest>

Arguments:
  <path-to-manifest>  Path to a sigil.toml manifest file

Output:
  Compiler-style diagnostics on stderr. Exit code 0 = clean, 1 = errors.

Example:
  sigil validate ./sigil.toml
`.trim())
}
