# Getting Started

This guide gets a new React + Vite user running with `tw-styled` quickly.

## Install

```bash
npm install tw-styled
npm install -D tw-styled-vite-plugin
```

If you want the prebuilt components:

```bash
npm install tw-styled-ui
```

## Vite setup

Configure the plugin in `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { twStyled } from 'tw-styled-vite-plugin'

export default defineConfig({
  plugins: [twStyled(), react()],
})
```

Then import the generated CSS once in your app entry:

```ts
// src/main.tsx
import 'virtual:tw-styled.css'
```

## First styled component

```tsx
import { styled } from 'tw-styled'

const BasicButton = styled.button`
  inline-flex items-center justify-center rounded-md
  bg-blue-600 px-4 py-2 text-white hover:bg-blue-700
`

export function Example() {
  return <BasicButton>Save</BasicButton>
}
```

## Dynamic variant props (`$` transient props)

```tsx
import { styled, type Props } from 'tw-styled'

type Variant = 'primary' | 'outline'
type ButtonProps = Props<{ $variant?: Variant }>

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[--primary] text-[--primary-foreground] hover:opacity-90',
  outline: 'border border-[--border] bg-transparent hover:bg-[--muted]',
}

const Button = styled.button<ButtonProps>`
  inline-flex items-center rounded-[--radius] px-4 py-2 text-sm font-medium
  ${(p: ButtonProps) => variantClasses[p.$variant ?? 'primary']}
`
```

`$variant` is not forwarded to the DOM because `$` props are transient.

## What the Vite plugin does

- scans source files for `styled.*\`...\`` and `styled(Component)\`...\``
- extracts static classes from template literal text
- emits CSS to `virtual:tw-styled.css`
- leaves interpolation results runtime-only

This means classes returned only from interpolation functions are **not** statically extracted.

## Next docs

- [Core API](./core-api.md)
- [UI package](./ui-package.md)
- [CLI transform](./cli-transform.md)
- [Troubleshooting and limitations](./troubleshooting.md)
