import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { parse as parseTOML } from 'smol-toml'

// ─── Manifest ─────────────────────────────────────────────────────────────────

export interface Manifest {
  /** Human-readable project label */
  name: string
  /** Absolute path to the root doctrine file */
  doctrinePath: string
  /** Absolute path to the directory containing charter files */
  chartersDir: string
  /** Absolute path to the directory containing sigil files */
  sigilsDir: string
  /** Directory the manifest file lives in — used for relative path resolution */
  baseDir: string
}

export class ManifestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ManifestError'
  }
}

export function loadManifest(manifestPath: string): Manifest {
  const absManifestPath = resolve(manifestPath)
  const baseDir = dirname(absManifestPath)

  let raw: string
  try {
    raw = readFileSync(absManifestPath, 'utf-8')
  } catch {
    throw new ManifestError(`Cannot read manifest file: ${absManifestPath}`)
  }

  let toml: unknown
  try {
    toml = parseTOML(raw)
  } catch (e) {
    throw new ManifestError(`Manifest is not valid TOML: ${(e as Error).message}`)
  }

  // Validate schema
  if (typeof toml !== 'object' || toml === null) {
    throw new ManifestError(`Manifest must be a TOML object`)
  }

  const root = toml as Record<string, unknown>

  const project = root['project']
  if (typeof project !== 'object' || project === null) {
    throw new ManifestError(`Manifest must contain a [project] table`)
  }
  const projectTable = project as Record<string, unknown>

  const name = projectTable['name']
  if (typeof name !== 'string' || name.trim() === '') {
    throw new ManifestError(`[project].name must be a non-empty string`)
  }

  const doctrine = projectTable['doctrine']
  if (typeof doctrine !== 'string' || doctrine.trim() === '') {
    throw new ManifestError(`[project].doctrine must be a non-empty string path`)
  }

  const paths = root['paths']
  if (typeof paths !== 'object' || paths === null) {
    throw new ManifestError(`Manifest must contain a [paths] table`)
  }
  const pathsTable = paths as Record<string, unknown>

  const charters = pathsTable['charters']
  if (typeof charters !== 'string' || charters.trim() === '') {
    throw new ManifestError(`[paths].charters must be a non-empty string path`)
  }

  const sigils = pathsTable['sigils']
  if (typeof sigils !== 'string' || sigils.trim() === '') {
    throw new ManifestError(`[paths].sigils must be a non-empty string path`)
  }

  return {
    name: name as string,
    doctrinePath: resolve(baseDir, doctrine as string),
    chartersDir: resolve(baseDir, charters as string),
    sigilsDir: resolve(baseDir, sigils as string),
    baseDir,
  }
}
