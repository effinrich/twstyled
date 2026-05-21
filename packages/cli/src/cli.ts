import { readFile, writeFile } from 'node:fs/promises'
import fg from 'fast-glob'
import pc from 'picocolors'
import { transform } from './transform'
import type { TransformSummary } from './types'

async function main() {
  const args = process.argv.slice(2)

  // Parse subcommand — only "transform" is supported
  const subcommand = args.find((a: string) => !a.startsWith('--'))
  const positionalArgs = args.filter((a: string) => !a.startsWith('--'))

  if (subcommand !== 'transform') {
    console.error('Usage: tw-styled-cli transform [glob] [--dry-run] [--summary]')
    process.exit(1)
  }

  const dryRun = args.includes('--dry-run')
  const showSummary = args.includes('--summary')

  // The glob is the second positional arg (after "transform"), or default
  const glob = positionalArgs[1] ?? '**/*.{tsx,jsx}'

  const files = await fg(glob, { ignore: ['node_modules/**', 'dist/**'] })
  const summary: TransformSummary = {
    filesProcessed: 0,
    filesTransformed: 0,
    filesSkipped: 0,
    totalComponentsTransformed: 0,
    errors: [],
  }

  for (const file of files) {
    summary.filesProcessed++
    try {
      const source = await readFile(file, 'utf8')
      const result = await transform(source, file, { dryRun })

      if (result.status === 'error') {
        summary.filesSkipped++
        summary.errors.push({ file, reason: result.error ?? 'unknown' })
        console.error(pc.red(`ERROR ${file}: ${result.error}`))
        continue
      }

      if (result.status === 'transformed') {
        summary.filesTransformed++
        summary.totalComponentsTransformed += result.componentsTransformed
        if (dryRun) {
          console.log(pc.cyan(`[dry-run] Would transform: ${file}`))
          if (result.diff) console.log(result.diff)
        } else {
          await writeFile(file, result.diff ?? source, 'utf8')
          console.log(pc.green(`✓ ${file} (${result.componentsTransformed} components)`))
        }
      } else {
        summary.filesSkipped++
      }
    } catch (err) {
      summary.filesSkipped++
      summary.errors.push({ file, reason: (err as Error).message })
      console.error(pc.red(`ERROR ${file}: ${(err as Error).message}`))
    }
  }

  if (showSummary) {
    console.log('\n' + pc.bold('Summary'))
    console.log(`  Files processed:    ${summary.filesProcessed}`)
    console.log(`  Files transformed:  ${summary.filesTransformed}`)
    console.log(`  Files skipped:      ${summary.filesSkipped}`)
    console.log(`  Components:         ${summary.totalComponentsTransformed}`)
    if (summary.errors.length > 0) {
      console.log(pc.red(`  Errors:             ${summary.errors.length}`))
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
