# **PROJECT_NAME**

[![CI](https://github.com/__REPO_SLUG__/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/__REPO_SLUG__/actions/workflows/ci.yml)
[![Bun](https://img.shields.io/badge/bun-1.x-000)](https://bun.sh)

> Visibility: \***\*VISIBILITY\*\*** • Package: `__PKG_NAME__`

A minimal, fast Bun + TypeScript project scaffold with consistent tooling:

- TypeScript (ESM, strict)
- Biome for linting/formatting
- Bun test runner
- GitHub Actions CI
- Optional tool pinning via `mise`

This repo was initialized from the `bun-ts-template`.

---

## Table of contents

- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [CI](#ci)
- [Configuration](#configuration)
- [Conventions](#conventions)
- [Keeping up to date](#keeping-up-to-date)
- [Releasing](#releasing-optional)
- [License](#license)

---

## Getting started

### Prerequisites

- **Bun** 1.x (`curl -fsSL https://bun.sh/install | bash`)
- (Optional) **mise** to pin tool versions

### Setup

```bash
# Install tools (if using mise)
mise install -y

# Install dependencies
bun install

# Verify everything is wired
bun run typecheck
bun run lint
bun test
```

---

## Scripts

Common tasks (see `package.json` for the canonical list):

```json
{
  "scripts": {
    "dev": "bun run --hot src/index.ts",
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "biome check .",
    "format": "biome format .",
    "test": "bun test"
  }
}
```

Usage:

```bash
bun run dev       # local dev with hot reload
bun run build     # emit JS to dist/
bun run typecheck # TS type checks, no emit
bun run lint      # static analysis
bun run format    # write formatting changes
bun test          # unit tests
```

---

## Project structure

```
.
├─ src/
│  └─ index.ts
├─ tests/
│  ├─ setup.ts
│  └─ index.test.ts
├─ scripts/
│  └─ init.ts            # removed by template init after first run
├─ .github/workflows/
│  └─ ci.yml
├─ bunfig.toml
├─ tsconfig.json
├─ mise.toml
├─ package.json
└─ README.md
```

---

## Development

- **ESM-only**. Prefer modern Node/Bun APIs and URL imports where reasonable.
- Keep modules small and pure; push side effects to `src/index.ts`.
- Example pattern:

```ts
/**
 * Returns a hello message.
 * @param name - The recipient name.
 * @returns A greeting string.
 */
export function greet(name: string): string {
  return `Hello, ${name}`;
}

if (import.meta.main) {
  // Minimal CLI entry (no dependencies)
  const who = process.argv[2] ?? 'world';
  console.log(greet(who));
}
```

---

## Testing

- Tests run with `bun test`.
- Global setup is configured in `bunfig.toml`:

```toml
[test]
preload = ["./tests/setup.ts"]
```

Write tests close to the code under test:

```ts
import { expect, test } from 'bun:test';
import { greet } from '../src/index.ts';

test('greet', () => {
  expect(greet('Riley')).toBe('Hello, Riley');
});
```

---

## CI

- CI runs on PRs and `main`.
- Workflow: `.github/workflows/ci.yml`
  - `bun install --frozen-lockfile`
  - `typecheck`, `lint`, `test`

Badge at the top links to the current workflow run history.

---

## Configuration

This template avoids runtime envs by default. If you need them:

1. Define a schema (e.g., Zod) and validate at startup.
2. Document required variables here.

Example:

```ts
/**
 * Validates and reads configuration from process.env.
 */
export interface AppConfig {
  port: number;
}

export function loadConfig(env = process.env): AppConfig {
  const port = Number(env.PORT ?? '3000');
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error('PORT must be a positive integer');
  }
  return { port };
}
```

---

## Conventions

- **Formatting/linting**: Biome (`bun run lint`, `bun run format`)
- **Type safety**: `bun run typecheck` in CI
- **Commits/PRs**: Keep PRs small and focused; include a test or rationale.

---

## Keeping up to date

If your repo uses the optional weekly “template sync” automation, shared files (e.g., `ci.yml`, `tsconfig.json`, `mise.toml`, `bunfig.toml`, `.editorconfig`) will be proposed via PR. Accept or modify as needed. Project-specific code is never auto-overwritten.

---

## Releasing (optional)

If you convert this to a library and add a release process (e.g., Changesets), document it here:

- Versioning strategy
- Publishing target (npm, GitHub Releases)
- Required tokens/permissions

---
