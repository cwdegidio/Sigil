#!/usr/bin/env node
import { loadManifest, ManifestError } from './manifest.js';
import { validate } from './validator.js';
import { report } from './reporter.js';
import { getContext } from './context.js';
// ─── CLI entry point ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(0);
}
const [command] = args;
if (command === 'context') {
    const roleFlag = args.indexOf('--role');
    if (roleFlag === -1 || !args[roleFlag + 1]) {
        console.error(`Missing argument: --role <author|consumer>`);
        printUsage();
        process.exit(1);
    }
    const role = args[roleFlag + 1];
    if (role !== 'author' && role !== 'consumer') {
        console.error(`Invalid role: '${role}'. Must be 'author' or 'consumer'.`);
        printUsage();
        process.exit(1);
    }
    process.stdout.write(getContext(role) + '\n');
    process.exit(0);
}
if (command !== 'validate') {
    console.error(`Unknown command: '${command}'`);
    printUsage();
    process.exit(1);
}
const manifestPath = args[1];
if (!manifestPath) {
    console.error(`Missing argument: <manifest-path>`);
    printUsage();
    process.exit(1);
}
let manifest;
try {
    manifest = loadManifest(manifestPath);
}
catch (e) {
    if (e instanceof ManifestError) {
        console.error(`Manifest error: ${e.message}`);
        process.exit(1);
    }
    throw e;
}
const { errors } = validate(manifest);
const exitCode = report(errors);
process.exit(exitCode);
function printUsage() {
    console.log(`
sigil — Sigil language reference validator

Usage:
  sigil validate <path-to-manifest>
  sigil context --role <author|consumer>

Commands:
  validate  Validate a Sigil corpus against the manifest
  context   Print AI context for the given role to stdout

Arguments:
  validate  <path-to-manifest>  Path to a sigil.toml manifest file
  context   --role author       Context for writing .sigil/.charter/.doctrine files
            --role consumer     Context for implementing from spec files

Output:
  validate  Compiler-style diagnostics on stderr. Exit code 0 = clean, 1 = errors.
  context   Markdown context artifact on stdout. Redirect to SIGIL-AUTHOR.md or
            SIGIL-CONSUMER.md in your project root.

Examples:
  sigil validate ./sigil.toml
  sigil context --role author > SIGIL-AUTHOR.md
  sigil context --role consumer > SIGIL-CONSUMER.md
`.trim());
}
//# sourceMappingURL=index.js.map