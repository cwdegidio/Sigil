import { KEYWORDS, STATUS_VALUES } from './types.js';
export function lex(source, file) {
    const tokens = [];
    const errors = [];
    const lines = source.split('\n');
    const indentStack = [0];
    let indentUnit = null; // inferred on first indented line
    function pos(line, col) {
        return { file, line, col };
    }
    function parseError(message, line, col) {
        errors.push({ category: 'PARSE', message, pos: pos(line, col) });
    }
    function pushToken(type, value, line, col) {
        tokens.push({ type, value, pos: pos(line, col) });
    }
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const lineNum = lineIdx + 1;
        const raw = lines[lineIdx];
        // Skip blank lines (whitespace-only)
        if (raw.trim() === '')
            continue;
        // ── Indentation ──────────────────────────────────────────────────────────
        // Check for tabs
        if (raw.includes('\t')) {
            const tabCol = raw.indexOf('\t') + 1;
            // Distinguish mixed vs pure-tab
            const leadingContent = raw.slice(0, raw.search(/\S/));
            if (leadingContent.includes(' ') && leadingContent.includes('\t')) {
                parseError('Mixed tabs and spaces in indentation', lineNum, tabCol);
            }
            else {
                parseError('Tabs are not permitted for indentation; use spaces', lineNum, tabCol);
            }
            continue;
        }
        // Count leading spaces
        let indent = 0;
        while (indent < raw.length && raw[indent] === ' ')
            indent++;
        const currentIndent = indentStack[indentStack.length - 1];
        if (indent > currentIndent) {
            // Indent increased
            const delta = indent - currentIndent;
            if (indentUnit === null) {
                indentUnit = delta;
            }
            else if (delta % indentUnit !== 0) {
                parseError(`Inconsistent indentation: expected a multiple of ${indentUnit} spaces, got ${delta} extra`, lineNum, indent + 1);
                continue;
            }
            indentStack.push(indent);
            pushToken('INDENT', '', lineNum, indent + 1);
        }
        else if (indent < currentIndent) {
            // Indent decreased — pop the stack until we match
            while (indentStack[indentStack.length - 1] > indent) {
                indentStack.pop();
                pushToken('DEDENT', '', lineNum, indent + 1);
            }
            if (indentStack[indentStack.length - 1] !== indent) {
                parseError(`Indentation level ${indent} does not match any enclosing block`, lineNum, indent + 1);
                continue;
            }
        }
        // ── Line content ─────────────────────────────────────────────────────────
        const content = raw.slice(indent);
        const contentStartCol = indent + 1; // 1-indexed
        // Check for leading `- ` (list-item marker)
        if (content.startsWith('- ')) {
            pushToken('DASH', '-', lineNum, contentStartCol);
            // The rest of the line (after '- ') is either a member-ref or FREE_TEXT.
            // Emit the remainder as tokens for the parser to interpret contextually.
            const rest = content.slice(2);
            const restCol = contentStartCol + 2;
            tokenizeLineContent(rest, lineNum, restCol, tokens, file);
        }
        else if (content === '-') {
            // Bare dash with nothing after it — still a list marker, empty content.
            // Parser will catch the missing content.
            pushToken('DASH', '-', lineNum, contentStartCol);
        }
        else {
            // Regular structured line
            tokenizeLineContent(content, lineNum, contentStartCol, tokens, file);
        }
        pushToken('NEWLINE', '', lineNum, contentStartCol + content.length);
    }
    // Emit remaining DEDENTs at EOF
    while (indentStack.length > 1) {
        indentStack.pop();
        pushToken('DEDENT', '', lines.length, 1);
    }
    pushToken('EOF', '', lines.length + 1, 1);
    return { tokens, errors };
}
// ─── Line Content Tokenizer ───────────────────────────────────────────────────
//
// Tokenizes a single line's content (after stripping leading indent and the
// optional DASH marker). Handles: keywords, STATUS, VERSION, IDENTIFIER,
// COLON, AT, QUOTED_STR, and FREE_TEXT.
//
// FREE_TEXT is a greedy fallback: once we encounter content that does not
// match a structured token at the current position, the rest of the line
// (up to end) is collected as a single FREE_TEXT token.
// ─────────────────────────────────────────────────────────────────────────────
function tokenizeLineContent(line, lineNum, startCol, tokens, file) {
    let i = 0;
    function pos(col) {
        return { file, line: lineNum, col };
    }
    function push(type, value, col) {
        tokens.push({ type, value, pos: pos(col) });
    }
    function currentCol() {
        return startCol + i;
    }
    // Try to match structured tokens greedily. Once a FREE_TEXT-triggering
    // character is encountered with no structural match, emit the rest as FREE_TEXT.
    while (i < line.length) {
        // Skip spaces between tokens
        if (line[i] === ' ') {
            i++;
            continue;
        }
        const col = currentCol();
        const remaining = line.slice(i);
        // QUOTED_STR — "..."
        if (line[i] === '"') {
            const closeIdx = line.indexOf('"', i + 1);
            if (closeIdx === -1) {
                // Unterminated string — rest of line is the string (parse error caught by parser)
                push('QUOTED_STR', line.slice(i), col);
                i = line.length;
            }
            else {
                push('QUOTED_STR', line.slice(i, closeIdx + 1), col);
                i = closeIdx + 1;
            }
            continue;
        }
        // AT — @
        if (line[i] === '@') {
            push('AT', '@', col);
            i++;
            continue;
        }
        // COLON — :
        if (line[i] === ':') {
            push('COLON', ':', col);
            i++;
            continue;
        }
        // VERSION — [0-9]+.[0-9]+ (match before bare numbers)
        const versionMatch = remaining.match(/^(\d+\.\d+)(?!\w)/);
        if (versionMatch) {
            push('VERSION', versionMatch[1], col);
            i += versionMatch[1].length;
            continue;
        }
        // IDENTIFIER — [A-Z][A-Za-z0-9]+
        const identMatch = remaining.match(/^([A-Z][A-Za-z0-9]+)/);
        if (identMatch) {
            push('IDENTIFIER', identMatch[1], col);
            i += identMatch[1].length;
            continue;
        }
        // Lowercase word — keyword, STATUS, or start of FREE_TEXT
        const wordMatch = remaining.match(/^([a-z][a-z]*)/);
        if (wordMatch) {
            const word = wordMatch[1];
            // Must check: is the next character still alphanumeric? If so, this is
            // the start of a free-text word (e.g., "submits" in "User submits the...").
            const afterWord = remaining.slice(word.length);
            const followedByWordChar = afterWord.length > 0 && /[A-Za-z0-9]/.test(afterWord[0]);
            if (!followedByWordChar && STATUS_VALUES.has(word)) {
                push('STATUS', word, col);
                i += word.length;
                continue;
            }
            if (!followedByWordChar && KEYWORDS.has(word)) {
                push('KEYWORD', word, col);
                i += word.length;
                continue;
            }
            // Not a keyword or status — rest of line is FREE_TEXT
            push('FREE_TEXT', line.slice(i).trimEnd(), col);
            i = line.length;
            continue;
        }
        // Single uppercase letter (not followed by alphanumeric) — not a valid
        // IDENTIFIER but could be start of free text
        if (/[A-Z]/.test(line[i])) {
            const nextChar = i + 1 < line.length ? line[i + 1] : '';
            if (!/[A-Za-z0-9]/.test(nextChar)) {
                // Single capital letter — treat rest as free text
                push('FREE_TEXT', line.slice(i).trimEnd(), col);
                i = line.length;
                continue;
            }
        }
        // Anything else — free text
        push('FREE_TEXT', line.slice(i).trimEnd(), col);
        i = line.length;
    }
}
//# sourceMappingURL=lexer.js.map