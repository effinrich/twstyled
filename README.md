# tw-styled

Styled-components ergonomics for Tailwind CSS with static extraction for template literals.

`tw-styled` lets you write Tailwind classes in tagged template literals while keeping runtime behavior simple:

- static classes are extracted by `tw-styled-vite-plugin` into `virtual:tw-styled.css`
- dynamic interpolations run at runtime based on props
- `$` transient props are stripped before DOM render
- consumer `className` wins conflicts through `tailwind-merge`

## Packages

| Package | What it provides |
| --- | --- |
| `tw-styled` | Core `styled` factory and types |
| `tw-styled-vite-plugin` | Vite plugin that extracts static classes |
| `tw-styled-ui` | Prebuilt UI components using `tw-styled` |
| `tw-styled-cli` | Codemod-like transform for `className` migration |

## Quick Start

```bash
npm install tw-styled
npm install -D tw-styled-vite-plugin
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { twStyled } from 'tw-styled-vite-plugin'

export default defineConfig({
  plugins: [twStyled(), react()],
})
```

```ts
// main.tsx
import 'virtual:tw-styled.css'
```

```tsx
import { styled } from 'tw-styled'

const Button = styled.button<{ $variant?: 'primary' | 'ghost' }>`
  inline-flex items-center rounded-md px-4 py-2
  ${(p) => (p.$variant === 'primary' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900')}
`
```

## Documentation

- [Getting started](./docs/getting-started.md)
- [Core API (`styled`, transient props, dynamic classes)](./docs/core-api.md)
- [UI package usage (`tw-styled-ui`)](./docs/ui-package.md)
- [CLI transform usage and migration examples](./docs/cli-transform.md)
- [IDE completions (VS Code snippets + JetBrains guidance)](./docs/ide-completions.md)
- [Gotchas, limitations, troubleshooting](./docs/troubleshooting.md)

## Development

```bash
pnpm install
pnpm build:all
pnpm test:all
pnpm typecheck:all
pnpm lint:all
```

## How Releases Work

This repo uses [Changesets](https://github.com/changesets/changesets) for automated versioning and npm publishing.

- PRs that touch `packages/**` must include a changeset file (`pnpm changeset`), enforced by `.github/workflows/changeset-status.yml`.
- Merged changesets accumulate on `main`.
- `.github/workflows/release.yml` runs on `main` and:
  - opens/updates a version PR when there are unreleased changesets
  - publishes `packages/core`, `packages/vite-plugin`, `packages/cli`, and `packages/ui` once the version PR is merged
  - skips private workspace packages (root + playground)
  - requests npm provenance (`--provenance`) and OIDC (`id-token: write`)
  - generates a lightweight CycloneDX SBOM artifact after publish (non-blocking)

### Maintainer First-Time Setup

1. **Configure npm trusted publishing (recommended)**
   - In npm package settings for each public package (`tw-styled`, `tw-styled-vite-plugin`, `tw-styled-cli`, `tw-styled-ui`), add this GitHub repository/workflow as a trusted publisher.
   - Keep package access as public (already configured with `publishConfig.access`).
2. **Repository permissions**
   - Ensure GitHub Actions has permission to create PRs and push version commits (workflow uses `contents: write`, `pull-requests: write`).
3. **Optional fallback secret**
   - Add `NPM_TOKEN` only if trusted publishing is not yet enabled. Do not hardcode tokens in workflows or source.

### Maintainer Workflow

1. Create package changes in a PR.
2. Run `pnpm changeset` and commit the generated `.changeset/*.md` file.
3. Merge to `main`.
4. Review and merge the automated "chore: version packages" PR.
5. Release workflow publishes automatically after that merge.

### Rollback Guidance

- **Bad release (recommended):** publish a quick patch with a fixes changeset, then deprecate the broken version on npm.
- **Immediate pullback:** if npm policy/time window allows unpublish, unpublish only the affected version, then publish a corrected patch.
- **Operational stop:** disable the `Release` workflow temporarily if repeated publish failures occur, then re-enable after fixing.

## License

MIT
