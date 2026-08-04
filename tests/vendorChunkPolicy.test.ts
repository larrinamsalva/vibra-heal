// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  classifyVendorModule,
  VENDOR_CHUNK_NAMES,
  VENDOR_CHUNK_PACKAGE_FAMILIES,
} from '../config/vendor-chunk-policy.mjs'

describe('vendor chunk policy', () => {
  it('classifies React runtime packages without absorbing similarly named packages', () => {
    expect(classifyVendorModule('/repo/node_modules/react/jsx-runtime.js')).toBe('vendor-react')
    expect(classifyVendorModule('/repo/node_modules/react-dom/client.js')).toBe('vendor-react')
    expect(classifyVendorModule('/repo/node_modules/react-reconciler/cjs/react-reconciler.production.js')).toBe('vendor-react')
    expect(classifyVendorModule('/repo/node_modules/scheduler/index.js')).toBe('vendor-react')
    expect(classifyVendorModule('/repo/node_modules/reactive-lib/index.js')).toBeUndefined()
  })

  it('classifies Three.js and rendering-support package families', () => {
    expect(classifyVendorModule('/repo/node_modules/three/build/three.module.js')).toBe('vendor-visual')
    expect(classifyVendorModule('/repo/node_modules/@react-three/fiber/dist/index.js')).toBe('vendor-visual')
    expect(classifyVendorModule('/repo/node_modules/@react-three/drei/index.js')).toBe('vendor-visual')
    expect(classifyVendorModule('/repo/node_modules/three-stdlib/index.js')).toBe('vendor-visual')
    expect(classifyVendorModule('/repo/node_modules/troika-three-text/dist/troika-three-text.esm.js')).toBe('vendor-visual')
    expect(classifyVendorModule('/repo/node_modules/three-helper-not-actually-three/index.js')).toBeUndefined()
  })

  it('normalizes Windows paths and leaves application or unrelated vendor modules unassigned', () => {
    expect(classifyVendorModule('C:\\repo\\node_modules\\react\\index.js')).toBe('vendor-react')
    expect(classifyVendorModule('C:\\repo\\node_modules\\three\\src\\Three.js')).toBe('vendor-visual')
    expect(classifyVendorModule('/repo/src/main.tsx')).toBeUndefined()
    expect(classifyVendorModule('/repo/node_modules/date-fns/index.js')).toBeUndefined()
  })

  it('publishes two distinct reviewed chunk families', () => {
    expect(VENDOR_CHUNK_NAMES).toEqual(['vendor-react', 'vendor-visual'])
    expect(Object.keys(VENDOR_CHUNK_PACKAGE_FAMILIES)).toEqual(VENDOR_CHUNK_NAMES)
    expect(VENDOR_CHUNK_PACKAGE_FAMILIES['vendor-react']).toContain('react-dom')
    expect(VENDOR_CHUNK_PACKAGE_FAMILIES['vendor-visual']).toContain('@react-three/fiber')
  })
})
