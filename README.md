# bun-lib-template

Fast, repeatable Bun + TypeScript project bootstrap for Charlie Labs.  
ESM-first, strict TS, no boilerplate fatigue.

> Use **GitHub’s Template Repository** flow to clone this into new projects, then run a tiny initializer to personalize the repo (name, URLs, README, etc.).

---

## Quick start (new repo from this template)

Using GitHub’s template feature:

```bash
# 1) Create the repo on GitHub from the template
gh repo create charlie-labs/my-new-service \
  --private \
  --template charlie-labs/bun-lib-template \
  --description "My new Bun service"

# 2) Clone & initialize
gh repo clone charlie-labs/my-new-service
cd my-new-service
bun run init --name=my-new-service --org=charlie-labs --visibility=private

# 3) Verify
bun install
bun run typecheck && bun run lint && bun test
```

One-liner convenience (optional):

```bash
gh alias set -s newbun 'gh repo create charlie-labs/$1 --private --template charlie-labs/bun-lib-template && gh repo clone charlie-labs/$1 && cd $1 && bun run init --name=$1 --org=charlie-labs'
# usage: gh newbun my-new-service
```

Local-only bootstrap (no GitHub yet):

```bash
bunx giget gh:charlie-labs/bun-lib-template my-new-service
cd my-new-service
git init -b main
bun run init --name=my-new-service --org=charlie-labs
```

---

## What you get

- **Bun + TypeScript (ESM)** with strict settings
- **Biome** for lint/format (Prettier-style formatting)
- **Bun test** with `tests/setup.ts`
- **GitHub Actions CI**: typecheck, lint, test
- **mise** tool pinning (Bun/Node/gh)
- Minimal starter code: `src/index.ts`, `tests/index.test.ts`
- **Initializer**: `scripts/init.ts` personalizes package/repo/README and makes the first commit

> Prefer Prettier over Biome? Swap `biome` scripts for `prettier` + `eslint` here. The template defaults to Biome for speed and fewer deps.

---

## Template files (high level)

```
.
├─ src/
│  └─ index.ts
├─ tests/
│  ├─ setup.ts
│  └─ index.test.ts
├─ scripts/
│  └─ init.ts            # runs once in new repo; may remove itself
├─ .github/workflows/
│  └─ ci.yml
├─ bunfig.toml
├─ tsconfig.json
├─ mise.toml
├─ package.json
├─ README_TEMPLATE.md    # copied & token-replaced into new repo as README.md
└─ README.md             # (this file) docs for *the template itself*
```

---

## Initialize step (what it actually does)

`scripts/init.ts`:

- Validates and sets `package.json` fields: `name`, `repository`, `homepage`, `bugs`
- Renders `README_TEMPLATE.md` → `README.md` (tokens: `__PROJECT_NAME__`, `__PKG_NAME__`, `__REPO_SLUG__`, `__VISIBILITY__`)
- Removes template-only files (and can remove itself)
- Runs `bun install`
- Creates the first commit

Flags:

```bash
bun run init --name=<projectName> --org=charlie-labs --visibility=private
```

---

## CI

`.github/workflows/ci.yml` runs on PRs + main:

- `bun install --frozen-lockfile`
- `bun run typecheck`
- `bun run lint`
- `bun test --bail`

Keep CI minimal. Project-specific jobs belong in downstream repos.

---

## Keeping downstream repos in sync (safe, curated)

Templates don’t auto-propagate. If you want shared files (CI, tsconfig, mise, editorconfig, etc.) to stay fresh, add this **downstream** workflow:

```yaml
name: template-sync
on:
  schedule:
    - cron: '17 5 * * 1' # weekly
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Checkout template
        uses: actions/checkout@v4
        with:
          repository: charlie-labs/bun-lib-template
          path: __template__

      - name: Copy curated files
        run: |
          rsync -av --delete __template__/.github/workflows/ci.yml .github/workflows/ci.yml
          rsync -av __template__/mise.toml mise.toml
          rsync -av __template__/tsconfig.json tsconfig.json
          rsync -av __template__/.editorconfig .editorconfig
          rsync -av __template__/bunfig.toml bunfig.toml

      - name: Create PR
        uses: peter-evans/create-pull-request@v6
        with:
          commit-message: 'chore(template): sync shared files'
          title: 'chore(template): sync shared files'
          body: 'Automated weekly sync from bun-lib-template.'
          branch: chore/template-sync
          labels: maintenance
```

> Be intentional. Don’t sync app code. Keep the allowlist small.

---

## Conventions

- **ESM only.** No CJS interop unless absolutely required.
- **JSDoc-first TS** in examples/snippets; keep types tight.
- **Small modules**; push side effects to entrypoints (`src/index.ts`).
- Tests live near code (`tests/` mirroring `src/`).

---

## Optional variations

- **Library mode**: Add Changesets + release workflow; publish to npm.
- **Service mode**: Add containerization, deploy workflows, env schema validation, health checks.

---

## Maintenance (template repo)

- Keep dependencies light and modern.
- Any new “shared defaults” should be added here first, then synced downstream via PRs.
- Avoid breaking changes in the template unless there’s a clear migration path.

---

## Troubleshooting

- `bun run init` fails: ensure `git` is initialized (the `gh repo create … && gh repo clone …` path handles this).
- CI can’t find Bun: check `oven-sh/setup-bun@v1` and version input.
- Formatter complaints: run `bun run format`, or switch to Prettier if that’s your team’s preference.
