export interface Manifest {
    /** Human-readable project label */
    name: string;
    /** Absolute path to the root doctrine file */
    doctrinePath: string;
    /** Absolute path to the directory containing charter files */
    chartersDir: string;
    /** Absolute path to the directory containing sigil files */
    sigilsDir: string;
    /** Directory the manifest file lives in — used for relative path resolution */
    baseDir: string;
}
export declare class ManifestError extends Error {
    constructor(message: string);
}
export declare function loadManifest(manifestPath: string): Manifest;
//# sourceMappingURL=manifest.d.ts.map