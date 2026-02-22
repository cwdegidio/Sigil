import { SigilError } from './types.js';
import { Manifest } from './manifest.js';
export interface ValidationResult {
    errors: SigilError[];
}
export declare function validate(manifest: Manifest): ValidationResult;
//# sourceMappingURL=validator.d.ts.map