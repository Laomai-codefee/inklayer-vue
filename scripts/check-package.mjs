import { access, readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const packageJson = JSON.parse(await readFile('package.json', 'utf8'))

function collectExportTargets(value) {
  if (typeof value === 'string') return [value]
  if (!value || typeof value !== 'object') return []
  return Object.values(value).flatMap(collectExportTargets)
}

const entryTargets = new Set([
  packageJson.main,
  packageJson.module,
  packageJson.types,
  ...collectExportTargets(packageJson.exports),
])
const runtimeAssets = [
  './dist/pdf.worker.min.mjs',
  './dist/images/cursor-editorInk.svg',
  './dist/images/editor-toolbar-delete.svg',
]
const targets = new Set([...entryTargets, ...runtimeAssets])
const missing = []

for (const target of targets) {
  if (!target) continue
  try {
    await access(resolve(target))
  } catch {
    missing.push(target)
  }
}

if (missing.length > 0) {
  throw new Error(`Missing package files: ${missing.join(', ')}`)
}

const esmSize = (await stat(resolve(packageJson.module))).size
const cjsSize = (await stat(resolve(packageJson.main))).size
const maximumEntrySize = 750_000
if (esmSize > maximumEntrySize || cjsSize > maximumEntrySize) {
  throw new Error(`Package entries are unexpectedly large: ESM ${esmSize} bytes, CJS ${cjsSize} bytes`)
}

console.log(`Verified ${targets.size} package files; ESM ${esmSize} bytes, CJS ${cjsSize} bytes.`)
