---
name: creating-skills
description: >-
  Creates, edits, and improves Claude Code skills. Use when the user wants
  to create a new skill from scratch, modify an existing SKILL.md, restructure
  a skill's references, optimize a skill's description for better triggering,
  or review a skill for best practices compliance.
argument-hint: "[new | path/to/SKILL.md]"
user-invocable: true
---

# Creating Skills — Workflow

## Overview

```
User intent → Search existing skills → Draft → Validate → Deliver
```

1. **Understand intent**: What should the skill do? When should it trigger? Who is the audience?
2. **Search existing skills**: Check `.claude/skills/`, `~/.claude/skills/`, and known skill repos for overlap or inspiration.
3. **Draft**: Write the SKILL.md with frontmatter and body, create references if needed.
4. **Validate**: Run the quality checklist. Fix issues.
5. **Deliver**: Confirm the skill appears in `/skills` and test invocation.

---

## Creating a New Skill

When `$ARGUMENTS` is "new" or the user asks to create a skill from scratch:

### Step 1 — Gather Requirements

Ask the user (if not already clear):
- What task does this skill automate or guide?
- When should Claude trigger it automatically? (or is it user-invocable only?)
- What tools does Claude need? (restrict with `allowed-tools` if possible)
- Where should it live? (project `.claude/skills/` or personal `~/.claude/skills/`)

### Step 2 — Choose a Name

- Use **gerund form** (verb ending in -ing): `creating-skills`, `reviewing-prs`, `deploying-services`
- Use **lowercase with hyphens** as separator
- Keep it short but descriptive (2-3 words ideal)

### Step 3 — Write the Description

The description is the **most critical field** — it determines when Claude triggers the skill.

Rules:
- Write in **third person** ("Creates X", not "Create X")
- Be **pushy**: describe both **what** the skill does AND **when** to use it
- Include concrete trigger phrases the user might say
- Keep it under 3 sentences in the short form; use the body for details

Example:
```yaml
description: >-
  Creates, edits, and improves Claude Code skills. Use when the user wants
  to create a new skill from scratch, modify an existing SKILL.md, or review
  a skill for best practices compliance.
```

### Step 4 — Structure the SKILL.md

Follow progressive disclosure:
1. **Frontmatter** (YAML) — metadata, triggers, constraints
2. **Body** (Markdown) — the workflow, instructions, rules
3. **References** (separate files) — detailed docs, examples, templates

Rules:
- SKILL.md body should be **< 500 lines** (ideally < 200)
- Move detailed reference material to `references/` subdirectory
- Use imperative instructions ("Do X", "Check Y", not "You should consider X")
- Structure with clear headers and numbered steps

### Step 5 — Create References (if needed)

Only create reference files for content that:
- Would make SKILL.md too long (> 200 lines body)
- Is consulted occasionally, not every invocation
- Contains structured data (tables, schemas, examples)

Place them in `<skill-name>/references/` and reference them from SKILL.md using relative paths.

### Step 6 — Write Files

Create the directory structure and write all files:
```
.claude/skills/<skill-name>/
├── SKILL.md
└── references/           # optional
    └── *.md
```

---

## Editing an Existing Skill

When `$ARGUMENTS` points to a SKILL.md path or the user asks to improve a skill:

1. **Read** the current SKILL.md and any references
2. **Identify issues** using the quality checklist below
3. **Propose changes** to the user before applying
4. **Apply edits** and verify the skill still loads in `/skills`

Common improvements:
- Sharpen the description for better auto-triggering
- Reduce body length by extracting references
- Add missing frontmatter fields (e.g., `allowed-tools`, `argument-hint`)
- Fix anti-patterns (see `references/patterns-and-examples.md`)

---

## Quality Checklist

Before finalizing any skill, verify:

### Frontmatter
- [ ] `name` is lowercase-hyphens, gerund form
- [ ] `description` explains what AND when (third person, pushy)
- [ ] `argument-hint` is set if the skill accepts arguments
- [ ] `allowed-tools` is set if the skill needs specific tools
- [ ] No unnecessary fields (don't add what you don't need)

### Body
- [ ] Under 500 lines (ideally under 200)
- [ ] Clear workflow with numbered steps
- [ ] Imperative tone ("Do X", not "Consider doing X")
- [ ] No temporal information (dates, versions that will expire)
- [ ] No duplicate content with references

### References
- [ ] Each file < 200 lines
- [ ] Flat structure (no nested directories inside references/)
- [ ] Descriptive filenames (not `ref1.md`)
- [ ] All referenced from SKILL.md

### Integration
- [ ] Skill appears in `/skills` output
- [ ] Description triggers correctly for intended use cases
- [ ] No conflict with existing skills

---

## References

For detailed documentation on specific topics:

- **Frontmatter fields**: See `references/frontmatter-reference.md` for all YAML fields, types, defaults, and substitution variables.
- **Patterns and examples**: See `references/patterns-and-examples.md` for proven patterns, anti-patterns, and concrete examples.
- **Structure guidelines**: See `references/structure-guidelines.md` for file organization, storage locations, and progressive disclosure.
