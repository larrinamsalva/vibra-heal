import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

type PackageManifest = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

type PackageLock = {
  lockfileVersion?: number
  packages?: Record<
    string,
    {
      version?: string
      resolved?: string
      integrity?: string
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
  >
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8')) as T
}

describe('reproducible npm install contract', () => {
  it('tracks a lockfile v3 whose root dependency declarations match package.json', () => {
    const manifest = readJson<PackageManifest>('../package.json')
    const lock = readJson<PackageLock>('../package-lock.json')
    const root = lock.packages?.['']

    expect(lock.lockfileVersion).toBe(3)
    expect(root).toBeDefined()
    expect(root?.dependencies).toEqual(manifest.dependencies)
    expect(root?.devDependencies).toEqual(manifest.devDependencies)
  })

  it('locks every direct dependency to a concrete registry package with integrity metadata', () => {
    const manifest = readJson<PackageManifest>('../package.json')
    const lock = readJson<PackageLock>('../package-lock.json')
    const directNames = [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.devDependencies ?? {}),
    ]

    for (const name of directNames) {
      const entry = lock.packages?.[`node_modules/${name}`]
      expect(entry, `${name} should be present in package-lock.json`).toBeDefined()
      expect(entry?.version, `${name} should have an exact locked version`).toMatch(/^\d/)
      expect(entry?.resolved, `${name} should have a registry source`).toMatch(/^https:\/\/registry\.npmjs\.org\//)
      expect(entry?.integrity, `${name} should have an integrity hash`).toMatch(/^sha512-/)
    }
  })

  it('keeps GitHub Actions read-only and installs strictly from the lockfile', () => {
    const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8')

    expect(workflow).toContain('permissions:\n  contents: read')
    expect(workflow).toContain('cache: npm')
    expect(workflow).toContain('cache-dependency-path: package-lock.json')
    expect(workflow).toContain('run: npm ci')
    expect(workflow).toContain('git diff --exit-code -- package-lock.json')
    expect(workflow).not.toMatch(/run:\s+npm install(?:\s|$)/)
  })
})
