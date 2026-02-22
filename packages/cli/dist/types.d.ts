export interface Position {
    file: string;
    line: number;
    col: number;
}
export type TokenType = 'INDENT' | 'DEDENT' | 'NEWLINE' | 'KEYWORD' | 'IDENTIFIER' | 'VERSION' | 'STATUS' | 'COLON' | 'DASH' | 'AT' | 'FREE_TEXT' | 'QUOTED_STR' | 'EOF';
export declare const KEYWORDS: Set<string>;
export declare const STATUS_VALUES: Set<string>;
export interface Token {
    type: TokenType;
    value: string;
    pos: Position;
}
export type ErrorCategory = 'PARSE' | 'VALIDATION';
export interface SigilError {
    category: ErrorCategory;
    message: string;
    pos: Position;
}
export interface IdentitySection {
    pos: Position;
    version: string;
    status: string;
    description?: string;
}
export interface VocabularyEntry {
    pos: Position;
    name: string;
    definition: string;
}
export interface VocabularySection {
    pos: Position;
    entries: VocabularyEntry[];
}
export interface ScopeSection {
    pos: Position;
    excludes: string[];
}
export interface InvariantsSection {
    pos: Position;
    items: string[];
}
export interface MemberRef {
    pos: Position;
    name: string;
    version?: string;
}
export type TriggerKind = 'single' | 'and' | 'or';
export interface TriggerField {
    pos: Position;
    kind: TriggerKind;
    items: string[];
}
export interface PreconditionsField {
    pos: Position;
    items: string[];
}
export interface PostconditionsField {
    pos: Position;
    items: string[];
}
export interface InvariantsField {
    pos: Position;
    items: string[];
}
export type ProvisionSubtype = 'behavior' | 'rule';
export interface BehaviorBody {
    kind: 'behavior';
    trigger: TriggerField;
    preconditions?: PreconditionsField;
    postconditions: PostconditionsField;
    invariants?: InvariantsField;
}
export interface RuleBody {
    kind: 'rule';
    preconditions: PreconditionsField;
    postconditions: PostconditionsField;
    invariants?: InvariantsField;
}
export interface ProvisionDeclaration {
    pos: Position;
    name: string;
    body: BehaviorBody | RuleBody;
}
export interface SigilFile {
    kind: 'sigil';
    pos: Position;
    name: string;
    identity: IdentitySection;
    vocabulary?: VocabularySection;
    scope?: ScopeSection;
    provisions: ProvisionDeclaration[];
    invariants?: InvariantsSection;
}
export interface CharterFile {
    kind: 'charter';
    pos: Position;
    name: string;
    identity: IdentitySection;
    sigils: MemberRef[];
    vocabulary?: VocabularySection;
    scope?: ScopeSection;
    invariants?: InvariantsSection;
}
export interface DoctrineFile {
    kind: 'doctrine';
    pos: Position;
    name: string;
    identity: IdentitySection;
    charters: MemberRef[];
    vocabulary?: VocabularySection;
    scope?: ScopeSection;
    invariants?: InvariantsSection;
}
export type ArtifactFile = SigilFile | CharterFile | DoctrineFile;
export interface ParseResult<T extends ArtifactFile> {
    ast: T | null;
    errors: SigilError[];
}
//# sourceMappingURL=types.d.ts.map