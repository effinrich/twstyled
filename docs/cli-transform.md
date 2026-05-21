# CLI Transform (`tw-styled-cli`)

`tw-styled-cli` helps migrate className-heavy JSX to `styled` components.

## Install and run

```bash
npx tw-styled-cli transform "src/**/*.{tsx,jsx}" --summary
```

For preview-only mode:

```bash
npx tw-styled-cli transform "src/**/*.{tsx,jsx}" --dry-run --summary
```

## What it transforms

- `className="..."`
- `className={"..."}`
- `className={\`...\`}` when template has no expressions
- `className={cn(...)}`
- `className={clsx(...)}`
- `className={twMerge(...)}`

It also:

- inserts `import { styled } from 'tw-styled'` when needed
- removes now-unused `cn` / `clsx` / `twMerge` imports

## Migration example: string literal

Before:

```tsx
export function Badge() {
  return <span className="inline-flex rounded-full px-2 py-1 text-xs">New</span>
}
```

After:

```tsx
import { styled } from 'tw-styled'

const StyledSpan = styled.span`inline-flex rounded-full px-2 py-1 text-xs`

export function Badge() {
  return <StyledSpan>New</StyledSpan>
}
```

## Migration example: `cn(...)`

Before:

```tsx
import { cn } from '@/lib/utils'

export function CTA() {
  return <button className={cn('px-4', 'py-2', 'rounded-md', 'bg-blue-600 text-white')}>Buy</button>
}
```

After:

```tsx
import { styled } from 'tw-styled'

const StyledButton = styled.button`px-4 py-2 rounded-md bg-blue-600 text-white`

export function CTA() {
  return <StyledButton>Buy</StyledButton>
}
```

## Important limitations

- Files already importing `styled` from `tw-styled` are skipped.
- Dynamic expressions inside `cn/clsx/twMerge` are not converted into interpolation logic.
- Only intrinsic lowercase JSX tags are rewritten. Existing component tags are not converted.
- Suggested workflow: run with `--dry-run` first, then transform smaller globs and review diffs.
