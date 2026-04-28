---
name: creating-agents
description: >-
  Creates, edits, and improves Claude Code agents (subagents). Use when the user
  wants to create a new custom agent, modify an existing agent definition,
  optimize an agent's description for better automatic delegation, configure
  agent tools/permissions/hooks, or review an agent for best practices.
argument-hint: "[new | path/to/agent.md]"
user-invocable: true
---

# Creating Agents — Workflow

## Overview

```
User intent → Search existing agents → Draft → Validate → Deliver
```

1. **Understand intent**: What task should the agent handle? When should Claude delegate to it? What tools does it need?
2. **Search existing agents**: Check `.claude/agents/`, `~/.claude/agents/`, and `/agents` output for overlap or inspiration.
3. **Draft**: Write the agent Markdown file with frontmatter and system prompt body.
4. **Validate**: Run the quality checklist. Fix issues.
5. **Deliver**: Confirm the agent appears in `/agents` and test delegation.

---

## Agents vs Skills

| Aspect | Agent (subagent) | Skill |
|---|---|---|
| **Context** | Isolated — own context window, own system prompt | Shared — runs in main conversation context |
| **Delegation** | Automatic based on `description` matching | Manual (`/skill-name`) or auto-triggered |
| **Tools** | Restricted via `tools` / `disallowedTools` | Restricted via `allowed-tools` |
| **Model** | Can override (`sonnet`, `haiku`, `opus`, `inherit`) | Can override via `model` field |
| **Nesting** | Cannot spawn other subagents | Can reference other skills |
| **Memory** | Optional persistent memory (`user`, `project`, `local`) | No built-in memory |
| **Use when** | Task is self-contained, produces verbose output, needs isolation or tool restrictions | Task needs main context, iterative refinement, or frequent user interaction |

---

## Creating a New Agent

When `$ARGUMENTS` is "new" or the user asks to create an agent from scratch:

### Step 1 — Gather Requirements

Ask the user (if not already clear):
- What task does this agent automate? What problem does it solve?
- When should Claude delegate to it automatically?
- What tools does it need? (restrict with `tools` if possible)
- Where should it live? (project `.claude/agents/` or user `~/.claude/agents/`)
- Does it need special permissions, hooks, memory, or isolation?

### Step 2 — Choose a Name

- Use **lowercase with hyphens**: `code-reviewer`, `db-reader`, `test-runner`
- Keep it short but descriptive (2-3 words ideal)
- The name is the unique identifier — no two agents can share the same name

### Step 3 — Write the Description

The description is the **most critical field** — Claude uses it to decide when to delegate.

Rules:
- Be **pushy**: describe both **what** the agent does AND **when** to use it
- Include "use proactively" if Claude should delegate without being asked
- Include concrete trigger phrases or scenarios
- Keep it under 3 sentences

Example:
```yaml
description: >-
  Expert code review specialist. Proactively reviews code for quality,
  security, and maintainability. Use immediately after writing or modifying code.
```

### Step 4 — Choose the Model

- `inherit` (default): same model as main conversation
- `sonnet`: fast, balanced — good for most agents
- `haiku`: fastest, cheapest — good for read-only exploration
- `opus`: most capable — for complex reasoning tasks

### Step 5 — Configure Tools

Use `tools` (allowlist) and/or `disallowedTools` (denylist):

```yaml
# Allowlist — only these tools available
tools: Read, Grep, Glob, Bash

# Denylist — inherit all except these
disallowedTools: Write, Edit

# Both — start from allowlist, remove specific ones
tools: Read, Edit, Bash, Grep, Glob
disallowedTools: Write
```

If `tools` is omitted, the agent inherits all tools from the main conversation.

To restrict which subagents can be spawned (only for agents run as main thread with `claude --agent`):
```yaml
tools: Agent(worker, researcher), Read, Bash
```

### Step 6 — Write the System Prompt

The body of the Markdown file becomes the system prompt. See `references/system-prompt-guidelines.md` for detailed guidance.

Key points:
- The agent receives ONLY this prompt + basic environment info (working dir)
- It does NOT receive the full Claude Code system prompt
- Structure: role → workflow when invoked → checklist/rules → output format
- Use imperative tone ("When invoked:", "Focus on:", not "You might want to")

### Step 7 — Configure Advanced Options (if needed)

Only add what you need. See `references/frontmatter-reference.md` for all fields:
- `permissionMode` — control permission prompts (`default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan`)
- `memory` — persistent cross-session learning (`user`, `project`, `local`)
- `hooks` — lifecycle hooks (`PreToolUse`, `PostToolUse`, `Stop`)
- `skills` — preload skill content into agent context
- `mcpServers` — MCP servers available to the agent
- `maxTurns` — limit agentic turns
- `background` — always run in background
- `isolation` — `worktree` for git worktree isolation

### Step 8 — Create the File

Write the agent file:
```
.claude/agents/<agent-name>.md    # project scope
~/.claude/agents/<agent-name>.md  # user scope
```

Verify with `/agents` that it appears and the description reads well.

---

## Editing an Existing Agent

When `$ARGUMENTS` points to an agent file or the user asks to improve an agent:

1. **Read** the current agent file
2. **Identify issues** using the quality checklist below
3. **Propose changes** to the user before applying
4. **Apply edits** and verify the agent still loads in `/agents`

Common improvements:
- Sharpen the description for better automatic delegation
- Restrict tools to the minimum needed
- Improve the system prompt structure (see `references/system-prompt-guidelines.md`)
- Add hooks for validation or conditional rules
- Enable memory for agents that benefit from cross-session learning

---

## Quality Checklist

Before finalizing any agent, verify:

### Frontmatter
- [ ] `name` is lowercase-hyphens, descriptive
- [ ] `description` explains what AND when (pushy, includes "proactively" if appropriate)
- [ ] `tools` is restricted to what the agent actually needs (don't inherit everything)
- [ ] `model` is appropriate for the task complexity
- [ ] No unnecessary fields (don't add what you don't need)

### System Prompt
- [ ] Clear role statement
- [ ] Structured workflow with numbered steps
- [ ] Imperative tone ("Do X", not "Consider doing X")
- [ ] Includes output format expectations
- [ ] Memory instructions if `memory` is enabled
- [ ] Not duplicating content that comes from preloaded `skills`

### Integration
- [ ] Agent appears in `/agents` output
- [ ] Description triggers correctly for intended use cases
- [ ] No conflict with existing agents (same name = higher priority wins)
- [ ] Hooks scripts are executable if using hooks

---

## References

For detailed documentation on specific topics:

- **Frontmatter fields**: See `references/frontmatter-reference.md` for all YAML fields, types, defaults, and constraints.
- **Patterns and examples**: See `references/patterns-and-examples.md` for proven patterns, anti-patterns, and concrete examples.
- **System prompt guidelines**: See `references/system-prompt-guidelines.md` for writing effective agent system prompts.
