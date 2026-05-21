# Contributing

Thanks for contributing to `tw-styled`.

## Prerequisites

- Node.js 18+
- pnpm 9+

## Setup

```bash
pnpm install
```

## Development Commands

```bash
# Build all packages
pnpm build:all

# Run all tests
pnpm test:all

# Typecheck all packages
pnpm typecheck:all

# Lint all packages
pnpm lint:all
```

For playground development:

```bash
cd playground
pnpm dev
```

## Pull Requests

- Keep PRs focused and small.
- Add or update tests when changing behavior.
- Ensure build, test, typecheck, and lint pass before requesting review.
- Update documentation for user-facing changes.

## Commit Messages

Use clear, imperative commit messages that describe intent (the "why"), not just file changes.
