# System Prompt Guidelines

## What the Agent Receives

The agent's system prompt is the Markdown body of the agent file. The agent receives:
- Its system prompt (your Markdown body)
- Basic environment info (working directory, platform)
- Memory instructions and content (if `memory` is enabled)
- Preloaded skill content (if `skills` are listed)

It does **NOT** receive the full Claude Code system prompt, CLAUDE.md instructions, or parent conversation context.

## Recommended Structure

```markdown
[Role — 1-2 sentences defining who the agent is]

When invoked:
1. [First action]
2. [Second action]
3. [Continue...]

[Domain rules / checklist — what to check, what to avoid]

[Output format — how to present results]
```

## Writing Rules

### Use Imperative Tone
Direct instructions, not suggestions.

```markdown
# BAD
You might want to consider checking for errors.

# GOOD
Check for errors. Report each with file path, line number, and fix.
```

### Be Specific About Workflow
The agent starts fresh each time. Tell it exactly what to do first.

```markdown
# BAD
Review the code and provide feedback.

# GOOD
When invoked:
1. Run git diff to see recent changes
2. Read each modified file
3. Check against the review checklist
4. Report findings by priority
```

### Define Output Format
Tell the agent how to present results so the main conversation can use them.

```markdown
Provide feedback organized by priority:
- Critical issues (must fix)
- Warnings (should fix)
- Suggestions (consider improving)

Include file path, line number, and a concrete fix for each issue.
```

### Include Memory Instructions (if applicable)
When `memory` is enabled, tell the agent what to remember and when.

```markdown
Update your agent memory as you discover:
- Key file locations and their purposes
- Architectural patterns and conventions
- Recurring issues and their solutions

Keep entries concise. Organize by topic, not chronologically.
```

### Don't Duplicate Skill Content
If the agent has `skills` preloaded, reference that knowledge — don't repeat it.

```markdown
# BAD (with skills: [api-conventions])
Follow these API conventions: [repeats everything from the skill]

# GOOD (with skills: [api-conventions])
Implement API endpoints. Follow the conventions from the preloaded skills.
```

## Length Guidelines

- **Minimum**: ~10 lines — enough for role + workflow + key rules
- **Sweet spot**: 20-50 lines — clear, structured, comprehensive
- **Maximum**: ~100 lines — beyond this, consider preloading content via `skills`

The system prompt IS the agent's entire context. Too short and it lacks guidance. Too long and it wastes tokens on every invocation.
