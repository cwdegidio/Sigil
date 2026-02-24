import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
// ─── sigil agent add ──────────────────────────────────────────────────────────
const SUPPORTED_AGENTS = ['claude-code'];
const AUTHOR_COMMAND = `\
Load \`SIGIL-AUTHOR.md\` from the project root into your context. You are now in Sigil author mode.

In this mode:
- You may only create or edit files with extensions: \`.sigil\`, \`.charter\`, \`.doctrine\`
- Do not modify implementation code, tests, or configuration files
- Use the grammar and conventions in \`SIGIL-AUTHOR.md\` as your guide
- Run \`sigil validate sigil.toml\` after writing or editing any spec file
- Ambiguity is a defect — write provisions so there is exactly one valid interpretation

When you are done authoring and ready to implement, use /consumer.
`;
const CONSUMER_COMMAND = `\
Load \`SIGIL-CONSUMER.md\` from the project root into your context. You are now in Sigil consumer mode.

In this mode:
1. Run \`sigil validate sigil.toml\` first. Do not proceed if there are errors.
2. Read the spec corpus starting from \`sigil.toml\`: doctrine → charters → sigils.
3. Produce an implementation plan based on the provisions in the sigil files.
4. Present the plan for approval before writing any code.
5. After approval, implement each provision precisely as specified.
6. If anything in the spec is ambiguous, flag it and ask — do not guess.

When you need to revise the spec, use /author.
`;
export function addAgent(agentName, outputDir) {
    if (!SUPPORTED_AGENTS.includes(agentName)) {
        console.error(`Unknown agent: '${agentName}'. Supported agents: ${SUPPORTED_AGENTS.join(', ')}`);
        process.exit(1);
    }
    const created = [];
    const skipped = [];
    function writeFile(relativePath, content) {
        const fullPath = join(outputDir, relativePath);
        if (existsSync(fullPath)) {
            skipped.push(relativePath);
        }
        else {
            writeFileSync(fullPath, content, 'utf8');
            created.push(relativePath);
        }
    }
    if (agentName === 'claude-code') {
        mkdirSync(join(outputDir, '.claude', 'commands'), { recursive: true });
        writeFile('.claude/commands/author.md', AUTHOR_COMMAND);
        writeFile('.claude/commands/consumer.md', CONSUMER_COMMAND);
    }
    return { created, skipped };
}
//# sourceMappingURL=agent.js.map