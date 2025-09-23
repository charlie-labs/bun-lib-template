#!/usr/bin/env bun
/**
 * Project initializer for template clones.
 *
 * Usage:
 *   bun scripts/init.ts --name=my-new-service --org=charlie-labs --visibility=private
 *
 * What it does:
 *   - Validates/normalizes the package name and repo URLs
 *   - Rewrites package.json: name, repository, homepage, bugs
 *   - Replaces tokens in README_TEMPLATE.md -> README.md
 *   - Removes template-only files and self
 *   - Rebuilds bun.lock and squashes the repo to a single root commit
 */
import { rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
const $ = Bun.$;

// Current script path is available via `import.meta.url` if needed.

/** Parse `--key=value` flags into a map. */
function parseFlags(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const i = arg.indexOf('=');
    if (i === -1) out[arg.slice(2)] = 'true';
    else out[arg.slice(2, i)] = arg.slice(i + 1);
  }
  return out;
}

/** Basic pkg name validation; returns a cleaned npm name. */
function sanitizePkgName(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-._/]/g, '-')
    .replace(/\/+/g, '/');
  return s;
}

const flags = parseFlags(process.argv.slice(2));
const projectName = flags['name'] ?? dirname(process.cwd());
const org = flags['org'] ?? 'charlie-labs';
const visibility = flags['visibility'] ?? 'private';

const pkgName = sanitizePkgName(projectName);
const repoSlug = `${org}/${projectName}`;
const repoUrl = `https://github.com/${repoSlug}`;

function log(msg: string) {
  // Keep stdout clean; Bun scripts are fast anyway.
  process.stdout.write(`[init] ${msg}\n`);
}

async function pathExists(p: string) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function rewritePackageJson() {
  const p = resolve(process.cwd(), 'package.json');
  const pkg = JSON.parse(await Bun.file(p).text());

  pkg.name = pkgName;
  pkg.repository = { type: 'git', url: `${repoUrl}.git` };
  pkg.homepage = repoUrl;
  pkg.bugs = { url: `${repoUrl}/issues` };

  // Optional: strip init script from future runs
  if (pkg.scripts?.init) {
    pkg.scripts.init = "echo 'Already initialized.'";
  }

  await Bun.write(p, JSON.stringify(pkg, null, 2) + '\n');
  log(`package.json updated (name=${pkgName})`);
}

async function materializeReadme() {
  const src = resolve(process.cwd(), 'README_TEMPLATE.md');
  const dst = resolve(process.cwd(), 'README.md');
  if (!(await pathExists(src))) return;

  let txt = await Bun.file(src).text();
  txt = txt
    .replaceAll(/__PROJECT_NAME__/g, projectName)
    .replaceAll(/__PKG_NAME__/g, pkgName)
    .replaceAll(/__REPO_SLUG__/g, repoSlug)
    .replaceAll(/__VISIBILITY__/g, visibility);

  await Bun.write(dst, txt);
  await rm(src);
  log('README.md created');
}

async function cleanupTemplateOnly() {
  // Add/remove as needed
  const maybe = ['.template-notes.md', 'TEMPLATE_TODO.md', 'scripts/README.md'];
  for (const f of maybe) {
    const p = resolve(process.cwd(), f);
    if (await pathExists(p)) {
      await rm(p, { recursive: true, force: true });
      log(`removed ${f}`);
    }
  }
  // Optionally remove this script (comment out if you want to keep it)
  const self = resolve(process.cwd(), 'scripts/init.ts');
  if (await pathExists(self)) {
    await rm(self);
    log('removed scripts/init.ts');
  }
}

/**
 * Install deps and rewrite git history to a single root commit reflecting
 * the current working tree. This leaves old commits unreachable (reflog GC
 * will clean them up later) and keeps the current branch name intact.
 */
async function installAndCommit() {
  await $`bun install`;

  // Stage all changes (adds, mods, deletions) so the index matches the tree.
  await $`git add -A`;

  // Create a brand‑new root commit from the current index and move HEAD to it.
  // 1) Write the index as a tree object
  const tree = (await $`git write-tree`.text()).trim();
  // 2) Create a commit with no parents from that tree
  const message = 'chore: initialize from template';
  const commit = (await $`git commit-tree ${tree} -m ${message}`.text()).trim();
  // 3) Replace the current branch tip with the new root commit
  await $`git reset --hard ${commit}`;

  log('dependencies installed and history squashed to a single commit');
  log(
    'Note: history was rewritten. If a remote is set, push with: git push --force-with-lease'
  );
}

(async () => {
  await rewritePackageJson();
  await materializeReadme();
  await cleanupTemplateOnly();
  await installAndCommit();
  log('Done.');
})().catch((err: unknown) => {
  const message =
    err instanceof Error ? (err.stack ?? err.message) : String(err);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
