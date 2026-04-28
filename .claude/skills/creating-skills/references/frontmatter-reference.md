# Frontmatter Reference

Complete YAML frontmatter fields for SKILL.md files.

## Required Fields

### `name`
- **Type**: string
- **Format**: lowercase-hyphens, gerund preferred (`creating-skills`, `reviewing-prs`)
- **Constraints**: Must match the directory name

### `description`
- **Type**: string (multi-line with `>-`)
- **Purpose**: Controls when Claude auto-triggers the skill AND appears in `/skills` list
- **Rules**:
  - Third person ("Creates X", not "Create X")
  - Pushy: include both WHAT and WHEN
  - Include trigger phrases users might say
  - 1-3 sentences

## Optional Fields

### `argument-hint`
- **Type**: string
- **Purpose**: Shown in `/skills` list to hint at expected arguments
- **Example**: `"[new | path/to/SKILL.md]"`, `"<pr-number>"`, `"-m 'message'"`

### `user-invocable`
- **Type**: boolean
- **Default**: `true`
- **Purpose**: If `true`, users can trigger with `/<skill-name>`. If `false`, only auto-triggered by Claude.

### `disable-model-invocation`
- **Type**: boolean
- **Default**: `false`
- **Purpose**: If `true`, prevents Claude from auto-triggering this skill. Only manual `/skill-name` works.

### `allowed-tools`
- **Type**: list of strings
- **Purpose**: Restrict which tools the skill can use. Reduces risk and focuses behavior.
- **Example**:
  ```yaml
  allowed-tools:
    - Read
    - Edit
    - Write
    - Glob
    - Grep
    - Bash
  ```

### `model`
- **Type**: string
- **Purpose**: Override the model used when this skill is invoked
- **Example**: `"claude-sonnet-4-6"` (for faster, cheaper skills)

### `context`
- **Type**: list of objects
- **Purpose**: Inject additional files or command output as context
- **Syntax**:
  ```yaml
  context:
    - file: "path/to/file.md"          # static file
    - command: "git log --oneline -10"  # dynamic command output
    - url: "https://example.com/doc"    # fetch URL content
  ```

### `agent`
- **Type**: object
- **Purpose**: Configure the skill as a sub-agent
- **Fields**: `model`, `tools`, `instructions`

### `hooks`
- **Type**: object
- **Purpose**: Run commands before/after the skill executes
- **Syntax**:
  ```yaml
  hooks:
    pre: "echo 'Starting skill'"
    post: "echo 'Skill complete'"
  ```

## Substitution Variables

Available in the SKILL.md body and frontmatter values:

| Variable | Description |
|---|---|
| `$ARGUMENTS` | Full argument string passed to the skill |
| `$1`, `$2`, ... `$N` | Positional arguments (space-separated) |
| `${CLAUDE_SESSION_ID}` | Unique session identifier |
| `${CLAUDE_SKILL_DIR}` | Absolute path to the skill's directory |

### Dynamic Context

Use backtick syntax in `context` to run commands:

```yaml
context:
  - command: !`git diff --cached`
```

The output is injected into the skill's context at invocation time.
