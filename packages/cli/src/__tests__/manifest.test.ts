import { describe, it, expect } from 'vitest'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { loadManifest, ManifestError } from '../manifest.js'

function makeTmpDir(): string {
  const dir = join(tmpdir(), `sigil-manifest-test-${Date.now()}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

function writeManifest(dir: string, content: string): string {
  const path = join(dir, 'sigil.toml')
  writeFileSync(path, content)
  return path
}

describe('manifest', () => {
  it('loads a valid manifest', () => {
    const dir = makeTmpDir()
    try {
      const toml = `
[project]
name = "TestProject"
doctrine = "ECommerce.doctrine"

[paths]
charters = "charters/"
sigils = "sigils/"
`.trim()
      const path = writeManifest(dir, toml)
      const manifest = loadManifest(path)

      expect(manifest.name).toBe('TestProject')
      expect(manifest.doctrinePath).toBe(resolve(dir, 'ECommerce.doctrine'))
      expect(manifest.chartersDir).toBe(resolve(dir, 'charters/'))
      expect(manifest.sigilsDir).toBe(resolve(dir, 'sigils/'))
      expect(manifest.baseDir).toBe(dir)
    } finally {
      rmSync(dir, { recursive: true })
    }
  })

  it('resolves paths relative to manifest file location, not cwd', () => {
    const dir = makeTmpDir()
    try {
      const toml = `
[project]
name = "Test"
doctrine = "sub/ECommerce.doctrine"

[paths]
charters = "sub/charters/"
sigils = "sub/sigils/"
`.trim()
      const path = writeManifest(dir, toml)
      const manifest = loadManifest(path)

      expect(manifest.doctrinePath).toBe(resolve(dir, 'sub/ECommerce.doctrine'))
      expect(manifest.chartersDir).toBe(resolve(dir, 'sub/charters/'))
      expect(manifest.sigilsDir).toBe(resolve(dir, 'sub/sigils/'))
    } finally {
      rmSync(dir, { recursive: true })
    }
  })

  it('throws ManifestError when file does not exist', () => {
    expect(() => loadManifest('/nonexistent/path/sigil.toml')).toThrow(ManifestError)
  })

  it('throws ManifestError when TOML is invalid', () => {
    const dir = makeTmpDir()
    try {
      const path = writeManifest(dir, 'this is not toml ===')
      expect(() => loadManifest(path)).toThrow(ManifestError)
    } finally {
      rmSync(dir, { recursive: true })
    }
  })

  it('throws ManifestError when [project] is missing', () => {
    const dir = makeTmpDir()
    try {
      const toml = `
[paths]
charters = "charters/"
sigils = "sigils/"
`.trim()
      const path = writeManifest(dir, toml)
      expect(() => loadManifest(path)).toThrow(ManifestError)
    } finally {
      rmSync(dir, { recursive: true })
    }
  })

  it('throws ManifestError when [paths] is missing', () => {
    const dir = makeTmpDir()
    try {
      const toml = `
[project]
name = "Test"
doctrine = "ECommerce.doctrine"
`.trim()
      const path = writeManifest(dir, toml)
      expect(() => loadManifest(path)).toThrow(ManifestError)
    } finally {
      rmSync(dir, { recursive: true })
    }
  })

  it('throws ManifestError when project.doctrine is missing', () => {
    const dir = makeTmpDir()
    try {
      const toml = `
[project]
name = "Test"

[paths]
charters = "charters/"
sigils = "sigils/"
`.trim()
      const path = writeManifest(dir, toml)
      expect(() => loadManifest(path)).toThrow(ManifestError)
    } finally {
      rmSync(dir, { recursive: true })
    }
  })
})
