# Gotchas, Limitations, Troubleshooting

## Core gotchas

### Dynamic-only classes are not statically extracted

The Vite plugin extracts static template literal segments. Classes returned only from interpolation functions are runtime-only.

```tsx
const Btn = styled.button`
  px-4 py-2
  ${(p) => (p.$primary ? 'bg-blue-600' : 'bg-gray-200')}
`
```

In this example, `px-4 py-2` are statically extractable; interpolation classes are runtime.

### `$` props are transient by design

Props that begin with `$` are removed before forwarding props to the target element/component.

### No built-in intrinsic polymorphic `as`

`styled.button` does not add special `as` typing. If you need polymorphism, wrap your own component that already supports `as`.

## Vite setup issues

### "I do not see generated styles"

Check all of these:

1. `twStyled()` is added to Vite plugins.
2. `virtual:tw-styled.css` is imported once in app entry.
3. Your files use `styled` from `tw-styled` (plugin scans for that usage).
4. Globs in plugin options include your source files.

### "Plugin misses a file"

Adjust options:

```ts
twStyled({
  include: ['**/*.{ts,tsx,js,jsx}'],
  exclude: ['node_modules/**'],
})
```

## CLI transform limitations

- Existing files that already import `styled` from `tw-styled` are skipped.
- Dynamic `cn/clsx/twMerge` expressions are not converted into interpolation logic.
- Transform focuses on intrinsic lowercase JSX tags with convertible className patterns.

## UI package notes

- `tw-styled-ui` provides transient `$` variant props (e.g. `$variant`, `$size`) on selected components.
- Complex primitives may rely on optional Radix peer dependencies.

## Debug workflow

1. run CLI in `--dry-run` mode for migration previews
2. run `pnpm typecheck:all`
3. run `pnpm test:all`
4. check final className output in browser devtools
