import { readFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { createFilter } from 'vite'
import { walkAST } from './ast-walker'
import { accumulateFileCSS } from './css-generator'
import type { TwstyledPluginOptions, PluginState } from './types'

const VIRTUAL_ID = 'virtual:tw-styled.css'
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID

export function twStyled(options: TwstyledPluginOptions = {}): Plugin {
  const state: PluginState = {
    cssMap: new Map(),
    componentMap: new Map(),
    options: {
      include: options.include ?? ['**/*.{tsx,ts,jsx,js}'],
      exclude: options.exclude ?? ['node_modules/**'],
      outputFile: options.outputFile ?? 'tw-styled.css',
      projectRoot: options.projectRoot ?? process.cwd(),
    },
  }

  const filter = createFilter(state.options.include, state.options.exclude)

  // Read components.json if present to discover CSS variable file
  let componentsCssPath: string | null = null
  const componentsJsonPath = resolve(state.options.projectRoot, 'components.json')
  if (existsSync(componentsJsonPath)) {
    try {
      const raw = JSON.parse(
        // Sync read at plugin init time is acceptable — runs once at startup
        readFileSync(componentsJsonPath, 'utf-8'),
      )
      const cssPath = raw?.tailwind?.css ?? raw?.cssVariables
      if (typeof cssPath === 'string') {
        componentsCssPath = resolve(state.options.projectRoot, cssPath)
      }
    } catch {
      // components.json is malformed or unreadable — continue without it
    }
  }

  return {
    name: 'tw-styled',

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_ID) {
        const all = Array.from(state.cssMap.values()).join('\n')
        return all || '/* tw-styled: no styles extracted yet */'
      }
    },

    transform(code, id) {
      if (!filter(id)) return
      if (!code.includes('tw-styled')) return

      const components = walkAST(code, id, state.options.projectRoot)
      if (components.length === 0) return

      state.componentMap.set(id, components)
      accumulateFileCSS(state.cssMap, id, components)

      // Code rewriting (inject resolveClasses calls) is a future enhancement —
      // the runtime handles class resolution for now.
      return null
    },

    async handleHotUpdate({ file, server }) {
      if (!filter(file)) return

      // Re-read and re-transform the changed file
      let code: string
      try {
        code = await readFile(file, 'utf-8')
      } catch {
        return
      }

      if (!code.includes('tw-styled')) {
        // File no longer uses tw-styled — clean up stale CSS
        if (state.cssMap.has(file)) {
          state.cssMap.delete(file)
          state.componentMap.delete(file)
        } else {
          return
        }
      } else {
        const components = walkAST(code, file, state.options.projectRoot)
        state.componentMap.set(file, components)
        accumulateFileCSS(state.cssMap, file, components)
      }

      // Invalidate the virtual CSS module so Vite serves fresh content
      const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID)
      if (mod) {
        server.moduleGraph.invalidateModule(mod)

        // Send HMR update to connected clients
        // Vite 6 uses server.hot; Vite 5 uses server.ws
        const ws = (server as any).hot ?? server.ws
        ws.send({
          type: 'update',
          updates: [
            {
              type: 'js-update',
              path: VIRTUAL_ID,
              acceptedPath: VIRTUAL_ID,
              timestamp: Date.now(),
            },
          ],
        })
      }
    },

    // Include the CSS variable file from components.json in the build context
    // so Tailwind's scanner picks up the custom property definitions
    buildStart() {
      if (componentsCssPath && existsSync(componentsCssPath)) {
        this.addWatchFile(componentsCssPath)
      }
    },

    // Replace the virtual CSS module content in the final bundle with the
    // fully-populated cssMap. During build, `load` is called before all
    // transforms complete, so the initial content is a placeholder. This
    // hook runs after all transforms and injects the real CSS.
    generateBundle(_options, bundle) {
      const css = Array.from(state.cssMap.values()).join('\n')

      for (const [fileName, asset] of Object.entries(bundle)) {
        if (asset.type === 'asset' && fileName.endsWith('.css')) {
          const source = typeof asset.source === 'string' ? asset.source : asset.source.toString()
          if (
            css &&
            (source.trim() === '' || source.includes('tw-styled: no styles extracted yet'))
          ) {
            asset.source = css
          } else if (css) {
            asset.source = source + '\n' + css
          }
        }
      }
    },
  }
}

export type { TwstyledPluginOptions }
