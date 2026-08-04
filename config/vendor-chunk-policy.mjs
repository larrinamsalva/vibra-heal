const REACT_RUNTIME_PACKAGES = [
  'react',
  'react-dom',
  'react-reconciler',
  'scheduler',
]

const VISUAL_RUNTIME_PACKAGES = [
  '@monogrid/gainmap-js',
  '@react-three/drei',
  '@react-three/fiber',
  '@use-gesture/core',
  '@use-gesture/react',
  'camera-controls',
  'detect-gpu',
  'fflate',
  'hls.js',
  'its-fine',
  'maath',
  'meshline',
  'meshoptimizer',
  'react-use-measure',
  'stats-gl',
  'suspend-react',
  'three',
  'three-mesh-bvh',
  'three-stdlib',
  'troika-three-text',
  'troika-three-utils',
  'troika-worker-utils',
  'zustand',
]

function normalizeModuleId(id) {
  return id.replaceAll('\\', '/')
}

function packageSegment(packageName) {
  return `/node_modules/${packageName}/`
}

function belongsToPackage(id, packageName) {
  return id.includes(packageSegment(packageName))
}

export function classifyVendorModule(moduleId) {
  const id = normalizeModuleId(moduleId)
  if (!id.includes('/node_modules/')) return undefined

  if (REACT_RUNTIME_PACKAGES.some((packageName) => belongsToPackage(id, packageName))) {
    return 'vendor-react'
  }

  if (VISUAL_RUNTIME_PACKAGES.some((packageName) => belongsToPackage(id, packageName))) {
    return 'vendor-visual'
  }

  return undefined
}

export const VENDOR_CHUNK_NAMES = ['vendor-react', 'vendor-visual']

export const VENDOR_CHUNK_PACKAGE_FAMILIES = {
  'vendor-react': [...REACT_RUNTIME_PACKAGES],
  'vendor-visual': [...VISUAL_RUNTIME_PACKAGES],
}
