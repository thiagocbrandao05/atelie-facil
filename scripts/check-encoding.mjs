import fs from 'node:fs'
import path from 'node:path'

const ROOT_DIR = process.cwd()
const SCAN_DIRS = ['src', '__tests__', 'tests', 'docs']
const ALLOWED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.css',
  '.scss',
  '.html',
  '.yml',
  '.yaml',
  '.sql',
])

const badPatterns = [
  /Ã¡/g,
  /Ã©/g,
  /Ãí/g,
  /Ãó/g,
  /Ãú/g,
  /Ã£/g,
  /Ã§/g,
  /Ãª/g,
  /Ã´/g,
  /Ãµ/g,
  /Ã�/g,
  /â€™/g,
  /â€œ/g,
  /â€\u009d/g,
  /â€“/g,
  /â€”/g,
  /â€¦/g,
  /â€¢/g,
  /âœ¨/g,
  /â¤/g,
  /ðŸ/g,
  /�/g,
]

function shouldScan(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return ALLOWED_EXTENSIONS.has(ext)
}

function walk(dirPath, acc) {
  if (!fs.existsSync(dirPath)) return
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'coverage') {
        continue
      }
      walk(fullPath, acc)
      continue
    }
    if (shouldScan(fullPath)) {
      acc.push(fullPath)
    }
  }
}

function collectOffenses(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split(/\r?\n/)
  const offenses = []

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (badPatterns.some(pattern => pattern.test(line))) {
      offenses.push({ lineNumber: i + 1, line: line.trim() })
    }
  }

  return offenses
}

const filesToScan = []
for (const dir of SCAN_DIRS) {
  walk(path.join(ROOT_DIR, dir), filesToScan)
}

const findings = []
for (const filePath of filesToScan) {
  const offenses = collectOffenses(filePath)
  if (offenses.length > 0) {
    findings.push({
      filePath: path.relative(ROOT_DIR, filePath).replaceAll('\\', '/'),
      offenses,
    })
  }
}

if (findings.length > 0) {
  console.error('\nEncoding check failed: possible mojibake found.\n')
  for (const finding of findings) {
    console.error(`- ${finding.filePath}`)
    for (const offense of finding.offenses.slice(0, 5)) {
      console.error(`  L${offense.lineNumber}: ${offense.line}`)
    }
    if (finding.offenses.length > 5) {
      console.error(`  ... +${finding.offenses.length - 5} ocorrência(s)`)
    }
  }
  console.error('\nNormalize these files in UTF-8 before commit.\n')
  process.exit(1)
}

console.log('Encoding check passed.')
