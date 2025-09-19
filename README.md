# bun-lib-template

Opinionated Bun + TypeScript library starter for Charlie Labs.

> Use **GitHub’s Template Repository** flow to clone this repo, then run the initializer script to personalize package metadata, README content, and git history.

> **Default branch:** The template (and repos created from it) start on `master`. Rename it to `main` if you prefer that convention.

---

## Quick start (new repo from this template)

Using GitHub’s template feature:

```bash
# 1) Create the repo on GitHub from the template
gh repo create charlie-labs/my-new-service \
  --private \
  --template charlie-labs/bun-lib-template \
  --description "My new Bun library"

# 2) Clone & initialize
gh repo clone charlie-labs/my-new-service
cd my-new-service
bun scripts/init.ts --name=my-new-service --org=charlie-labs --visibility=private

# 3) Verify
bun install
bun run typecheck
bun run lint
bun test
```

One-liner convenience (optional):

```bash
gh alias set -s newbun 'gh repo create charlie-labs/$1 --private --template charlie-labs/bun-lib-template && gh repo clone charlie-labs/$1 && cd $1 && bun scripts/init.ts --name=$1 --org=charlie-labs --visibility=private'
# usage: gh newbun my-new-service
```

Local-only bootstrap (no GitHub yet):

```bash
bunx giget gh:charlie-labs/bun-lib-template my-new-service
cd my-new-service
git init -b master
bun scripts/init.ts --name=my-new-service --org=charlie-labs --visibility=private
```

> The initializer rewrites `package.json`, materializes a project-specific `README.md`, removes template-only files (including itself), runs `bun install`, and makes the first commit.

> Prefer `main` as your default branch? Rename it after the initializer finishes: `git branch -m master main` and update CI/badges accordingly.

---

## What you get

- **Bun 1.x + strict TypeScript (ESM)** configured via `tsconfig.json`
- **ESLint + Prettier** scripts (`bun run lint`, `bun run fix`) and Husky + lint-staged pre-commit hooks
- **Bun test** with an example spec in `src/index.test.ts`
- **Build & metadata tooling**: `bun run build` drives `zshy` using the repo’s `"zshy"` manifest key to emit dual CJS/ESM bundles, while CI separately runs `tshy` to regenerate `package.json` metadata and fail if it drifts
- **Knip** for dead-code analysis (`bunx knip`)
- **GitHub Actions CI** on PRs and `master`, including a `tshy` check that keeps `package.json` in sync

---

## Template files (high level)

```
.
├─ src/
│  ├─ index.ts
│  └─ index.test.ts
├─ scripts/
│  └─ init.ts            # run once in new repos, then removes itself
├─ .github/workflows/
│  └─ ci.yml
├─ eslint.config.js
├─ knip.ts
├─ tsconfig.json
├─ bun.lock
├─ .prettierignore
├─ package.json
├─ README_TEMPLATE.md    # source for downstream README.md
└─ README.md             # (this file) docs for the template itself
```

> This template tracks the human-readable `bun.lock` produced by `bun install --save-text-lock`. Regenerate it with `bun install` whenever dependencies change.

---

## Initialize step (what it actually does)

`scripts/init.ts`:

- Validates and sets `package.json` fields: `name`, `repository`, `homepage`, `bugs`
- Renders `README_TEMPLATE.md` → `README.md` (tokens: `__PROJECT_NAME__`, `__PKG_NAME__`, `__REPO_SLUG__`, `__VISIBILITY__`)
- Removes template-only helper files (including `scripts/init.ts`)
- Runs `bun install` to refresh the lockfile
- Creates the first commit (`chore: initialize from template`)

Flags:

```bash
bun scripts/init.ts --name=<projectName> --org=charlie-labs --visibility=private
```

---

## CI

`.github/workflows/ci.yml` runs on PRs and pushes to `master`:

- `bun install --frozen-lockfile`
- `bunx -y tshy` (fails if `package.json` would change)
- `bun run ci` (typecheck ➝ lint ➝ test)

Keep CI lean. Downstream services can add custom workflows as needed.

---
