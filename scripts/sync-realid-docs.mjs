import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = '/Users/jieli/development/RealID/realid-sdd-requirements'
const targetDir = path.join(projectRoot, 'src/content/docs/realid-sdd-requirements')

await rm(targetDir, { force: true, recursive: true })
await mkdir(path.dirname(targetDir), { recursive: true })
await cp(sourceDir, targetDir, {
  dereference: true,
  filter: (source) => !source.endsWith('.DS_Store'),
  recursive: true,
})

await rewriteMarkdownLinks(targetDir)

console.log(`Synced RealID docs:\n  ${sourceDir}\n  -> ${targetDir}`)

async function rewriteMarkdownLinks(directory) {
  const entries = await readdir(directory, { withFileTypes: true })

  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        await rewriteMarkdownLinks(fullPath)
        return
      }

      if (!/\.(md|markdown)$/i.test(entry.name)) {
        return
      }

      const fileStat = await stat(fullPath)
      if (!fileStat.isFile()) {
        return
      }

      const markdown = await readFile(fullPath, 'utf8')
      const rewritten = markdown
        .replaceAll(`${sourceDir}/`, '')
        .replaceAll(sourceDir, '.')

      if (rewritten !== markdown) {
        await writeFile(fullPath, rewritten)
      }
    }),
  )
}
