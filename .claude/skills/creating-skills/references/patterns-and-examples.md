# Patterns and Examples

## Proven Patterns

### Template Pattern
The skill provides a reusable template that Claude fills in based on context.

```yaml
name: creating-issues
description: >-
  Creates well-structured GitHub issues. Use when the user wants to file a bug
  report, feature request, or task with proper labels and description.
argument-hint: "[bug | feature | task] <title>"
```

Body provides a template:
```markdown
## Steps
1. Determine issue type from `$1` (bug, feature, task)
2. Use the appropriate template below
3. Fill in details from conversation context
4. Create via `gh issue create`

### Bug Template
- Title: `[Bug] $2`
- Labels: bug, triage
- Body: Steps to reproduce, expected vs actual, environment
...
```

### Conditional Workflow Pattern
The skill branches based on arguments or context.

```markdown
## Workflow

If `$ARGUMENTS` is "new" or empty:
  → Follow the creation workflow (Section A)

If `$ARGUMENTS` is a file path:
  → Read the file and follow the editing workflow (Section B)

If `$ARGUMENTS` is "review":
  → Run the quality checklist (Section C)
```

### Feedback Loop Pattern
The skill iterates with user input at key checkpoints.

```markdown
## Steps
1. Generate initial draft
2. Present to user for review
3. Incorporate feedback
4. Repeat steps 2-3 until approved
5. Finalize output
```

### Progressive Disclosure Pattern
Start simple, reference details only when needed.

```markdown
## Quick Start
1. Do X
2. Do Y
3. Done

## Advanced Options
For custom configuration, see `references/advanced-config.md`.
```

---

## Anti-Patterns

### Temporal Information
Never include dates, versions, or "current" references that will become stale.

```yaml
# BAD
description: "Uses the new Claude 4.5 API released in January 2025"

# GOOD
description: "Generates API calls using the Claude SDK"
```

### Too Many Options
Don't overwhelm with choices. Guide toward the right path.

```markdown
# BAD
You can use method A, B, C, D, or E. Each has trade-offs...

# GOOD
Use method A (recommended). For special cases, see references/alternatives.md.
```

### Nested References
Don't create references that reference other references.

```
# BAD
references/
  overview.md          → links to details.md
  details.md           → links to sub-details.md
  sub-details.md

# GOOD
references/
  api-fields.md        (self-contained)
  examples.md          (self-contained)
```

### Inconsistent Terminology
Pick one term and stick with it throughout.

```markdown
# BAD
"skill" in SKILL.md, "plugin" in references, "extension" in examples

# GOOD
"skill" everywhere
```

### Overly Passive Instructions
Skills should be directive, not suggestive.

```markdown
# BAD
You might want to consider checking if the file exists before proceeding.

# GOOD
Check if the file exists. If not, create it.
```

---

## Example: Minimal Skill

```yaml
---
name: formatting-code
description: >-
  Formats code files according to project conventions. Use when the user asks
  to format, lint, or clean up code style.
argument-hint: "[file-path]"
allowed-tools:
  - Bash
  - Read
  - Edit
---

# Formatting Code

1. Read the file at `$ARGUMENTS` (or ask the user which file)
2. Detect the language from the file extension
3. Run the appropriate formatter:
   - Go: `gofmt -w <file>`
   - Python: `ruff format <file>`
   - TypeScript: `npx prettier --write <file>`
4. Show the diff to the user
```

## Example: Skill with References

```yaml
---
name: reviewing-prs
description: >-
  Reviews pull requests for code quality, security, and best practices.
  Use when the user asks to review a PR, check a diff, or audit changes.
argument-hint: "<pr-number>"
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
---

# Reviewing PRs

## Workflow
1. Fetch PR diff: `gh pr diff $1`
2. Analyze changes against the checklist in `references/review-checklist.md`
3. Check for security issues listed in `references/security-patterns.md`
4. Post review summary

## References
- `references/review-checklist.md` — full review criteria
- `references/security-patterns.md` — common vulnerabilities to check
```
