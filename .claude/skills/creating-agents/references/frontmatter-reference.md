# Frontmatter Reference

Complete YAML frontmatter fields for agent Markdown files.

## Required Fields

### `name`
- **Type**: string
- **Format**: lowercase-hyphens (`code-reviewer`, `db-reader`, `test-runner`)
- **Constraints**: Must be unique across all scopes (higher priority location wins on conflict)

### `description`
- **Type**: string (multi-line with `>-`)
- **Purpose**: Controls when Claude automatically delegates to this agent AND appears in `/agents` list
- **Rules**:
  - Be pushy: include both WHAT and WHEN
  - Include "use proactively" or "use immediately" for auto-delegation
  - Include concrete trigger scenarios
  - 1-3 sentences

## Optional Fields

### `tools`
- **Type**: comma-separated string or list
- **Purpose**: Allowlist of tools the agent can use. If omitted, inherits all tools from main conversation.
- **Available tools**: `Read`, `Edit`, `Write`, `Glob`, `Grep`, `Bash`, `Agent`, plus any MCP tools
- **Special syntax**: `Agent(worker, researcher)` restricts which subagents can be spawned (only for agents run as main thread with `claude --agent`)
- **Example**:
  ```yaml
  tools: Read, Grep, Glob, Bash
  ```

### `disallowedTools`
- **Type**: comma-separated string or list
- **Purpose**: Denylist — removed from inherited or specified tool list
- **Example**:
  ```yaml
  disallowedTools: Write, Edit
  ```

### `model`
- **Type**: string
- **Values**: `sonnet`, `opus`, `haiku`, `inherit`
- **Default**: `inherit` (same model as main conversation)
- **Guidance**:
  - `haiku` — fast, cheap: exploration, simple review
  - `sonnet` — balanced: most agents
  - `opus` — most capable: complex reasoning
  - `inherit` — match the user's current model

### `permissionMode`
- **Type**: string
- **Values**:
  | Mode | Behavior |
  |---|---|
  | `default` | Standard permission checking with prompts |
  | `acceptEdits` | Auto-accept file edits |
  | `dontAsk` | Auto-deny permission prompts (explicitly allowed tools still work) |
  | `bypassPermissions` | Skip all permission checks (use with caution) |
  | `plan` | Plan mode (read-only exploration) |
- **Note**: If the parent uses `bypassPermissions`, it takes precedence and cannot be overridden.

### `maxTurns`
- **Type**: integer
- **Purpose**: Maximum number of agentic turns before the agent stops
- **Default**: No limit (runs until task complete)

### `skills`
- **Type**: list of strings (skill names)
- **Purpose**: Preload skill content into the agent's context at startup. The full skill content is injected, not just made available for invocation.
- **Note**: Subagents don't inherit skills from the parent conversation — list them explicitly.
- **Example**:
  ```yaml
  skills:
    - api-conventions
    - error-handling-patterns
  ```

### `mcpServers`
- **Type**: object or list
- **Purpose**: MCP servers available to this agent
- **Syntax**: Each entry is either a server name (referencing an already-configured server) or an inline definition
- **Example**:
  ```yaml
  mcpServers:
    slack: {}
    custom-server:
      command: node
      args: ["./mcp-server.js"]
  ```

### `hooks`
- **Type**: object
- **Purpose**: Lifecycle hooks scoped to this agent. Only run while the agent is active.
- **Supported events**:
  | Event | Matcher input | When it fires |
  |---|---|---|
  | `PreToolUse` | Tool name | Before the agent uses a tool |
  | `PostToolUse` | Tool name | After the agent uses a tool |
  | `Stop` | (none) | When the agent finishes (converted to `SubagentStop` at runtime) |
- **Example**:
  ```yaml
  hooks:
    PreToolUse:
      - matcher: "Bash"
        hooks:
          - type: command
            command: "./scripts/validate-command.sh"
    PostToolUse:
      - matcher: "Edit|Write"
        hooks:
          - type: command
            command: "./scripts/run-linter.sh"
  ```
- **Hook input**: Claude Code passes JSON via stdin with tool input in `tool_input`. Exit code 2 blocks the operation.

### `memory`
- **Type**: string
- **Values**: `user`, `project`, `local`
- **Purpose**: Persistent memory directory that survives across conversations
- **Scopes**:
  | Scope | Location | Use when |
  |---|---|---|
  | `user` | `~/.claude/agent-memory/<name>/` | Learnings should apply across all projects |
  | `project` | `.claude/agent-memory/<name>/` | Knowledge is project-specific, shareable via VCS |
  | `local` | `.claude/agent-memory-local/<name>/` | Project-specific, NOT committed to VCS |
- **When enabled**: System prompt includes memory instructions + first 200 lines of `MEMORY.md`. Read, Write, Edit tools auto-enabled.

### `background`
- **Type**: boolean
- **Default**: `false`
- **Purpose**: Always run this agent as a background task (concurrent with main conversation)
- **Note**: Background agents auto-deny unpre-approved permissions. Permission prompts happen before launch.

### `isolation`
- **Type**: string
- **Values**: `worktree`
- **Purpose**: Run the agent in a temporary git worktree (isolated copy of the repository)
- **Note**: Worktree is auto-cleaned if the agent makes no changes. If changes are made, the worktree path and branch are returned.

## Storage Locations & Priority

| Location | Scope | Priority |
|---|---|---|
| `--agents` CLI flag | Current session | 1 (highest) |
| `.claude/agents/` | Current project | 2 |
| `~/.claude/agents/` | All your projects | 3 |
| Plugin's `agents/` directory | Where plugin is enabled | 4 (lowest) |

Higher priority shadows lower priority when names conflict.

## CLI-Defined Agents

Pass agents as JSON with `--agents` for session-only agents:

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer...",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

Use `prompt` for the system prompt (equivalent to the Markdown body in file-based agents). All frontmatter fields are supported.

## Disabling Agents

Add to `permissions.deny` in settings:
```json
{ "permissions": { "deny": ["Agent(Explore)", "Agent(my-custom-agent)"] } }
```

Or via CLI: `claude --disallowedTools "Agent(Explore)"`
