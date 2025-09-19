#!/usr/bin/env bun
/**
 * Project initializer for template clones.
 *
 * Usage:
 *   bun run scripts/init.ts --name=my-new-service --org=charlie-labs --visibility=private
 *
 * What it does:
 *   - Validates/normalizes the package name and repo URLs
 *   - Rewrites package.json: name, repository, homepage, bugs
 *   - Replaces tokens in README_TEMPLATE.md -> README.md
 *   - Removes template-only files and self
 *   - Rebuilds bun.lockb and creates the first commit
 */
import { exec as _exec } from 'node:child_process';
import { readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
const exec = (cmd: string) =>
  new Promise<string>((res, rej) =>
    _exec(cmd, (err, stdout, stderr) =>
      err ? rej(new Error(stderr || stdout)) : res(stdout)
    )
  );

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
  const pkg = JSON.parse(await readFile(p, 'utf8'));

  pkg.name = pkgName;
  pkg.repository = { type: 'git', url: `${repoUrl}.git` };
  pkg.homepage = repoUrl;
  pkg.bugs = { url: `${repoUrl}/issues` };

  // Optional: strip init script from future runs
  if (pkg.scripts?.init) {
    pkg.scripts.init = "echo 'Already initialized.'";
  }

  await writeFile(p, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  log(`package.json updated (name=${pkgName})`);
}

async function materializeReadme() {
  const src = resolve(process.cwd(), 'README_TEMPLATE.md');
  const dst = resolve(process.cwd(), 'README.md');
  if (!(await pathExists(src))) return;

  let txt = await readFile(src, 'utf8');
  txt = txt
    .replaceAll(/__PROJECT_NAME__/g, projectName)
    .replaceAll(/__PKG_NAME__/g, pkgName)
    .replaceAll(/__REPO_SLUG__/g, repoSlug)
    .replaceAll(/__VISIBILITY__/g, visibility);

  await writeFile(dst, txt, 'utf8');
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

async function installAndCommit() {
  await exec('bun install');
  // Ensure lockfile in repo
  await exec('git add -A && git commit -m "chore: initialize from template"');
  log('dependencies installed and initial commit created');
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
