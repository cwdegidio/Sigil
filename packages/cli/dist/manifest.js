import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { parse as parseTOML } from 'smol-toml';
export class ManifestError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ManifestError';
    }
}
export function loadManifest(manifestPath) {
    const absManifestPath = resolve(manifestPath);
    const baseDir = dirname(absManifestPath);
    let raw;
    try {
        raw = readFileSync(absManifestPath, 'utf-8');
    }
    catch {
        throw new ManifestError(`Cannot read manifest file: ${absManifestPath}`);
    }
    let toml;
    try {
        toml = parseTOML(raw);
    }
    catch (e) {
        throw new ManifestError(`Manifest is not valid TOML: ${e.message}`);
    }
    // Validate schema
    if (typeof toml !== 'object' || toml === null) {
        throw new ManifestError(`Manifest must be a TOML object`);
    }
    const root = toml;
    const project = root['project'];
    if (typeof project !== 'object' || project === null) {
        throw new ManifestError(`Manifest must contain a [project] table`);
    }
    const projectTable = project;
    const name = projectTable['name'];
    if (typeof name !== 'string' || name.trim() === '') {
        throw new ManifestError(`[project].name must be a non-empty string`);
    }
    const doctrine = projectTable['doctrine'];
    if (typeof doctrine !== 'string' || doctrine.trim() === '') {
        throw new ManifestError(`[project].doctrine must be a non-empty string path`);
    }
    const paths = root['paths'];
    if (typeof paths !== 'object' || paths === null) {
        throw new ManifestError(`Manifest must contain a [paths] table`);
    }
    const pathsTable = paths;
    const charters = pathsTable['charters'];
    if (typeof charters !== 'string' || charters.trim() === '') {
        throw new ManifestError(`[paths].charters must be a non-empty string path`);
    }
    const sigils = pathsTable['sigils'];
    if (typeof sigils !== 'string' || sigils.trim() === '') {
        throw new ManifestError(`[paths].sigils must be a non-empty string path`);
    }
    return {
        name: name,
        doctrinePath: resolve(baseDir, doctrine),
        chartersDir: resolve(baseDir, charters),
        sigilsDir: resolve(baseDir, sigils),
        baseDir,
    };
}
//# sourceMappingURL=manifest.js.map