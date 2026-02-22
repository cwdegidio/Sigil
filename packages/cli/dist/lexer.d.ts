import { Token, SigilError } from './types.js';
export interface LexResult {
    tokens: Token[];
    errors: SigilError[];
}
export declare function lex(source: string, file: string): LexResult;
//# sourceMappingURL=lexer.d.ts.map