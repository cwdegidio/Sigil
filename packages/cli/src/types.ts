// ─── Positions ───────────────────────────────────────────────────────────────

export interface Position {
  file: string
  line: number // 1-indexed
  col: number  // 1-indexed
}

// ─── Tokens ──────────────────────────────────────────────────────────────────

export type TokenType =
  | 'INDENT'      // virtual: indentation increased
  | 'DEDENT'      // virtual: indentation decreased
  | 'NEWLINE'     // end of a non-blank line
  | 'KEYWORD'     // reserved lowercase word
  | 'IDENTIFIER'  // [A-Z][A-Za-z0-9]+
  | 'VERSION'     // [0-9]+.[0-9]+
  | 'STATUS'      // draft | active | deprecated
  | 'COLON'       // :
  | 'DASH'        // - (list-item marker at line start)
  | 'AT'          // @
  | 'FREE_TEXT'   // unstructured line content
  | 'QUOTED_STR'  // "..."
  | 'EOF'

export const KEYWORDS = new Set([
  'sigil', 'charter', 'doctrine', 'provision',
  'identity', 'vocabulary', 'scope', 'invariants',
  'trigger', 'preconditions', 'postconditions',
  'behavior', 'rule', 'and', 'or', 'excludes',
  'version', 'status', 'description', 'definition',
  'sigils', 'charters',
])

export const STATUS_VALUES = new Set(['draft', 'active', 'deprecated'])

export interface Token {
  type: TokenType
  value: string
  pos: Position
}

// ─── Errors ──────────────────────────────────────────────────────────────────

export type ErrorCategory = 'PARSE' | 'VALIDATION'

export interface SigilError {
  category: ErrorCategory
  message: string
  pos: Position
}

// ─── AST — Shared Productions ────────────────────────────────────────────────

export interface IdentitySection {
  pos: Position
  version: string
  status: string
  description?: string
}

export interface VocabularyEntry {
  pos: Position
  name: string
  definition: string
}

export interface VocabularySection {
  pos: Position
  entries: VocabularyEntry[]
}

export interface ScopeSection {
  pos: Position
  excludes: string[]
}

export interface InvariantsSection {
  pos: Position
  items: string[]
}

export interface MemberRef {
  pos: Position
  name: string
  version?: string // present when pinned with @
}

// ─── AST — Provision ─────────────────────────────────────────────────────────

export type TriggerKind = 'single' | 'and' | 'or'

export interface TriggerField {
  pos: Position
  kind: TriggerKind
  items: string[]
}

export interface PreconditionsField {
  pos: Position
  items: string[]
}

export interface PostconditionsField {
  pos: Position
  items: string[]
}

export interface InvariantsField {
  pos: Position
  items: string[]
}

export type ProvisionSubtype = 'behavior' | 'rule'

export interface BehaviorBody {
  kind: 'behavior'
  trigger: TriggerField
  preconditions?: PreconditionsField
  postconditions: PostconditionsField
  invariants?: InvariantsField
}

export interface RuleBody {
  kind: 'rule'
  preconditions: PreconditionsField
  postconditions: PostconditionsField
  invariants?: InvariantsField
}

export interface ProvisionDeclaration {
  pos: Position
  name: string
  body: BehaviorBody | RuleBody
}

// ─── AST — File Declarations ─────────────────────────────────────────────────

export interface SigilFile {
  kind: 'sigil'
  pos: Position
  name: string
  identity: IdentitySection
  vocabulary?: VocabularySection
  scope?: ScopeSection
  provisions: ProvisionDeclaration[]
  invariants?: InvariantsSection
}

export interface CharterFile {
  kind: 'charter'
  pos: Position
  name: string
  identity: IdentitySection
  sigils: MemberRef[]
  vocabulary?: VocabularySection
  scope?: ScopeSection
  invariants?: InvariantsSection
}

export interface DoctrineFile {
  kind: 'doctrine'
  pos: Position
  name: string
  identity: IdentitySection
  charters: MemberRef[]
  vocabulary?: VocabularySection
  scope?: ScopeSection
  invariants?: InvariantsSection
}

export type ArtifactFile = SigilFile | CharterFile | DoctrineFile

// ─── Parse Result ─────────────────────────────────────────────────────────────

export interface ParseResult<T extends ArtifactFile> {
  ast: T | null
  errors: SigilError[]
}
