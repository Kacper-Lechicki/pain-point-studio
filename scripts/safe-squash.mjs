import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * SAFE SQUASH
 *
 * Wraps `supabase migration squash` with a safety check that prevents
 * squashing migrations already applied on production.
 *
 * How it works:
 *   1. Runs `supabase migration list` to fetch remote migration status
 *   2. Identifies which local migrations are already applied remotely
 *   3. If --to <version> targets an already-applied migration, aborts
 *   4. If no --to flag, checks if ANY applied migration would be squashed
 *
 * Usage:
 *   node scripts/safe-squash.mjs [--to <version>]
 *
 * Requires:
 *   - Supabase CLI linked to a project (`supabase link`)
 *   - SUPABASE_ACCESS_TOKEN set (or interactive login)
 */

const MIGRATIONS_DIR = path.resolve('supabase/migrations');

// ---------------------------------------------------------------------------
// Parse args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const toIndex = args.indexOf('--to');
const toVersion = toIndex !== -1 ? args[toIndex + 1] : null;

// ---------------------------------------------------------------------------
// Get remote migration status
// ---------------------------------------------------------------------------

function getRemoteAppliedVersions() {
  try {
    const output = execSync('supabase migration list', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Parse the table output — look for lines with version numbers
    // Format: "│ <version> │ ... │ ... │"
    const versions = new Set();

    for (const line of output.split('\n')) {
      // Match lines that contain a timestamp-like version and don't say "Not present"
      // in the remote column (3rd column)
      const cells = line.split('│').map((c) => c.trim());

      if (cells.length < 4) continue;

      const version = cells[1];
      const remote = cells[3]; // Remote column

      // Version is a numeric timestamp like 20260303120000
      if (/^\d{14}$/.test(version) && !remote.includes('Not present')) {
        versions.add(version);
      }
    }

    return versions;
  } catch (error) {
    console.error(
      '\n  Could not fetch remote migration status.',
      '\n  Make sure the project is linked: supabase link --project-ref <ref>',
      '\n  And SUPABASE_ACCESS_TOKEN is set.\n'
    );
    console.error(`  Error: ${error.message}\n`);
    process.exit(1);
  }
}

function getLocalVersions() {
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql'));

  return files
    .map((f) => f.match(/^(\d{14})/)?.[1])
    .filter(Boolean)
    .sort();
}

// ---------------------------------------------------------------------------
// Safety check
// ---------------------------------------------------------------------------

const remoteApplied = getRemoteAppliedVersions();
const localVersions = getLocalVersions();

if (remoteApplied.size === 0) {
  console.log('No remote migrations detected — squash is safe.\n');
} else {
  console.log(`Remote has ${remoteApplied.size} applied migration(s).`);

  // Find local migrations that are on remote (these must NOT be squashed)
  const appliedLocally = localVersions.filter((v) => remoteApplied.has(v));

  if (appliedLocally.length === 0) {
    console.log('None of your local migrations are on remote — squash is safe.\n');
  } else {
    console.log(`Applied on remote: ${appliedLocally.join(', ')}\n`);

    if (toVersion) {
      // Check if --to target includes any applied migration
      const wouldSquash = appliedLocally.filter((v) => v <= toVersion);

      if (wouldSquash.length > 0) {
        console.error('ABORT: --to target would squash migrations already on production:\n');

        for (const v of wouldSquash) {
          console.error(`  - ${v}`);
        }

        console.error(
          '\n  These migrations cannot be squashed because they are already applied remotely.',
          '\n  Only squash migrations that have NOT been pushed to production.',
          `\n  The earliest safe --to target is: ${appliedLocally[appliedLocally.length - 1]} (excluded)\n`
        );
        process.exit(1);
      }
    } else {
      // No --to flag: supabase squash will try to squash everything into one
      // This is only safe if there are unpushed migrations to squash
      const unpushed = localVersions.filter((v) => !remoteApplied.has(v));

      if (unpushed.length < 2) {
        console.error('ABORT: Nothing safe to squash.');
        console.error('  All local migrations are already applied on production.\n');
        process.exit(1);
      }

      // Default squash without --to would squash ALL including applied ones
      console.error('ABORT: Running squash without --to would squash applied migrations.\n');
      console.error('  Use --to to squash only unpushed migrations:');
      console.error(`  pnpm supabase:migration:squash --to ${unpushed[unpushed.length - 1]}\n`);
      console.error(`  Safe range (unpushed): ${unpushed[0]} → ${unpushed[unpushed.length - 1]}\n`);
      process.exit(1);
    }
  }
}

// ---------------------------------------------------------------------------
// Run the actual squash
// ---------------------------------------------------------------------------

const squashArgs = toVersion ? `--to ${toVersion}` : '';

console.log(`Running: supabase migration squash ${squashArgs}\n`);

try {
  execSync(`supabase migration squash ${squashArgs}`, {
    stdio: 'inherit',
  });
} catch {
  process.exit(1);
}

// Run make-migration-idempotent on the result
console.log('\nMaking squashed migration idempotent...\n');

try {
  execSync('node scripts/make-migration-idempotent.mjs', {
    stdio: 'inherit',
  });
} catch {
  process.exit(1);
}

console.log('\nSquash complete. Run `pnpm supabase:reset` to verify locally.');
