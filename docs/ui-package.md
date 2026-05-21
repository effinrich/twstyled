# `tw-styled-ui` Usage

`tw-styled-ui` provides prebuilt components that follow shadcn-style token patterns and variant props.

## Install

```bash
npm install tw-styled-ui
```

It is expected to be used with:

- `react`
- `tw-styled`
- `tailwind-merge`

Some components also use optional Radix peer dependencies.

## Common usage

```tsx
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from 'tw-styled-ui'

export function ProfileCard() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Search users..." />
        <div className="flex items-center gap-2">
          <Button $variant="default">Save</Button>
          <Button $variant="outline" $size="sm">
            Cancel
          </Button>
          <Badge $variant="secondary">Beta</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
```

## Variant props in prebuilt components

Examples from package APIs:

- `Button` supports `$variant` and `$size`
- `Badge` supports `$variant`

Like core `tw-styled`, these variant props are transient (`$`-prefixed) and not forwarded to DOM elements.

## Imports by surface

Default surface (`tw-styled-ui`) exports simple components plus Radix-backed ones.

You can also import from:

- `tw-styled-ui/base`
- `tw-styled-ui/radix`

Use this when you want explicit control over which implementation surface you pull from.

## shadcn token usage

The components are authored with CSS variable utility classes like:

- `bg-[--primary]`
- `text-[--primary-foreground]`
- `rounded-[--radius]`

This keeps them compatible with token-driven themes.
