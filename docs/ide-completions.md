# IDE Completions

This repo includes practical authoring support via VS Code snippets.

## VS Code snippets

A project snippet file is provided at:

- `.vscode/tw-styled.code-snippets`

It covers common patterns:

- `twstyled-import` - import `styled`
- `twstyled-basic` - basic `styled.tag` template
- `twstyled-variant` - typed variant map + transient prop usage
- `twstyled-wrap` - `styled(Component)` wrapper pattern
- `twstyled-ui-card` - quick `tw-styled-ui` composition
- `twstyled-shadcn-token` - token class pattern (`bg-[--primary]`, etc.)

### Enable/use in VS Code

1. Open this folder in VS Code.
2. Start typing a snippet prefix in a `.ts`/`.tsx` file.
3. Accept a snippet from IntelliSense.

These snippets are workspace-scoped and do not require extension publishing.

## Type-driven completion notes

For stronger completion in your own components:

- define variant prop unions (`'default' | 'outline' | ...`)
- pass them in `styled.button<...>`
- use `Record<Variant, string>` maps for interpolation class results

Example:

```tsx
type Variant = 'default' | 'outline'

const classes: Record<Variant, string> = {
  default: 'bg-[--primary] text-[--primary-foreground]',
  outline: 'border border-[--border]',
}
```

This gives better IntelliSense and compile-time checks than ad hoc string comparisons.

## JetBrains guidance (optional)

JetBrains IDEs do not read VS Code snippet files directly. Two low-friction options:

- create Live Templates using the same prefixes as `.vscode/tw-styled.code-snippets`
- add postfix templates for repetitive variant map scaffolding

If needed, copy each snippet body into your JetBrains Live Template entries.
