# Structure Guidelines

## Directory Organization

```
<skill-name>/
├── SKILL.md              # Entry point — frontmatter + workflow
└── references/           # Optional — detailed docs, examples, templates
    ├── *.md              # Reference files (flat, no nesting)
    ├── scripts/          # Helper scripts (if needed)
    └── assets/           # Static assets (templates, schemas)
```

### Rules
- **Flat references**: All reference files at one level inside `references/`. No subdirectories of subdirectories.
- **Descriptive names**: `frontmatter-reference.md`, not `ref1.md` or `docs.md`.
- **TOC for long files**: Add a table of contents for any file > 100 lines.
- **Self-contained references**: Each reference file should make sense on its own without reading others.

## Storage Locations

Skills are loaded from multiple locations, in priority order (highest first):

| Location | Scope | Use Case |
|---|---|---|
| Enterprise policy | Organization-wide | Enforced standards |
| `~/.claude/skills/` | Personal (all projects) | User's personal workflows |
| `.claude/skills/` | Project-specific | Team/project conventions |
| Plugin skills | Installed plugins | Third-party integrations |

A skill in a higher-priority location **shadows** one with the same name in a lower-priority location.

### Choosing the Right Location
- **Personal workflow** (your coding style, your tools) → `~/.claude/skills/`
- **Team convention** (PR format, deploy process) → `.claude/skills/` (committed)
- **Sensitive/local** (API keys in context, local paths) → `.claude/skills/` (gitignored)

## Progressive Disclosure

Structure information in layers so Claude loads only what it needs:

1. **Layer 1 — Frontmatter**: Name, description, constraints. Always loaded by Claude to decide whether to trigger the skill.
2. **Layer 2 — SKILL.md body**: Core workflow. Loaded when the skill is triggered. Keep under 200 lines.
3. **Layer 3 — References**: Detailed docs. Loaded on demand when the workflow references them. No line limit per file, but keep each file focused.

### Why This Matters
- Smaller SKILL.md = faster skill matching and less context used
- References are only read when explicitly needed in the workflow
- Users browsing `/skills` see clean, concise descriptions
