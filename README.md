# bun-lib-template

Opinionated Bun + TypeScript library starter for Charlie Labs.

> Use **GitHub’s Template Repository** flow to clone this repo, then run the initializer script to personalize package metadata, README content, and git history.

> **Default branch:** The template (and repos created from it) start on `master`. Rename it to `main` if you prefer that convention.

---

## Quick start (new repo from this template)

Using GitHub’s template feature:

```bash
export ORG=your-org-or-username  # optional; defaults to "charlie-labs" if unset

# 1) Create the repo on GitHub from the template
gh repo create "${ORG:-charlie-labs}/my-new-service" \
  --private \
  --template charlie-labs/bun-lib-template \
  --description "My new Bun library"

# 2) Clone & initialize
gh repo clone "${ORG:-charlie-labs}/my-new-service"
cd my-new-service
bun scripts/init.ts --name=my-new-service --org="${ORG:-charlie-labs}" --visibility=private

# 3) Verify
bun install
bun run typecheck
bun run lint
bun test
```

One-liner convenience (optional):

```bash
export ORG=your-org-or-username  # optional; defaults to "charlie-labs" if unset
gh alias set -s newbun 'gh repo create "${ORG:-charlie-labs}/$1" --private --template charlie-labs/bun-lib-template && gh repo clone "${ORG:-charlie-labs}/$1" && cd "$1" && bun scripts/init.ts --name="$1" --org="${ORG:-charlie-labs}" --visibility=private'
# usage: gh newbun my-new-service
```

Local-only bootstrap (no GitHub yet):

```bash
bunx giget gh:charlie-labs/bun-lib-template my-new-service
cd my-new-service
git init -b master
export ORG=your-org-or-username  # optional; defaults to "charlie-labs" if unset
bun scripts/init.ts --name=my-new-service --org="${ORG:-charlie-labs}" --visibility=private
```

> The initializer rewrites `package.json`, materializes a project-specific `README.md`, removes template-only files (including itself), runs `bun install`, and makes the first commit.

> Prefer `main` as your default branch? Rename it after the initializer finishes: `git branch -m master main` and update CI/badges accordingly.

---

## What you get

- **Bun 1.x + strict TypeScript (ESM)** configured via `tsconfig.json`
- **ESLint + Prettier** scripts (`bun run lint`, `bun run fix`) and Husky + lint-staged pre-commit hooks
- **Bun test** with an example spec in `src/index.test.ts`
- **Build & metadata tooling**: `bun run build` drives `zshy` (configured via the `"zshy"` key in `package.json`) to emit dual CJS/ESM bundles; CI also runs `bun run build` to regenerate `package.json` metadata and catch drift
- **Knip** for dead-code analysis (`bunx knip`)
- **GitHub Actions CI** on PRs and `master`, including a `package.json` drift check based on `bun run build` (zshy)

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
# Example
export PROJECT=my-new-service
export ORG=your-org-or-username  # optional; defaults to "charlie-labs" if unset
bun scripts/init.ts --name="$PROJECT" --org="${ORG:-charlie-labs}" --visibility=private
```

---

## CI

`.github/workflows/ci.yml` runs on PRs and pushes to `master`:

- `bun install --frozen-lockfile`
- `bun run build` (ensures `package.json` is current via zshy; CI fails if it would change)
- `bun run ci` (typecheck ➝ lint ➝ test)

Keep CI lean. Downstream services can add custom workflows as needed.

---

## Releasing & publishing

This template includes an auto‑publish workflow, but it is **disabled in the template repository itself**. The workflow becomes active in repositories created from this template.

Why: we gate the workflow with `if: ${{ !github.event.repository.is_template && secrets.NPM_TOKEN != '' }}` at the job level in `.github/workflows/release.yml` so the template never attempts to publish.

In downstream repos, it will auto‑publish to npm on merge to the default branch (currently `master`). You only need to bump the version and merge a PR.

1. Create a branch and bump the version in `package.json` without creating a git tag:

   ```bash
   # pick one: patch | minor | major | or an explicit version
   npm version patch --no-git-tag-version
   # or: npm version 0.0.13 --no-git-tag-version
   ```

2. Commit the change and open a PR. Keep the PR limited to the version bump and any release notes you want in the description.

3. When the PR is merged to the default branch, the workflow at `.github/workflows/release.yml` will:
   - run typecheck and ESLint
   - publish to npm if the version is new (requires `NPM_TOKEN`)
   - create a GitHub Release with generated notes

Notes:

- Don’t push git tags manually; the workflow creates the tag during the GitHub Release step.
- If no new version is present (i.e., `package.json` didn’t change), the publish step is skipped and no release is created.
- The publish step skips npm lifecycle scripts; typecheck and lint run explicitly in the workflow.

### npm auth for the GitHub workflow

To publish to npm from GitHub Actions, add an npm access token as a secret named `NPM_TOKEN`:

1. Create an npm access token with at least “Publish” permission in your npm account settings.
2. In this repository’s Settings → Secrets and variables → Actions, add a new Repository secret named `NPM_TOKEN` with that token’s value. An Organization secret works too.
3. Nothing else is required—our release workflow already:
   - requests `id-token: write` for npm provenance support, and
   - uses `actions/setup-node@v4` to provide a recent npm version during publish.

If your org enforces “Require provenance” on npm, the existing `provenance: true` input on the publish step satisfies it.

---
