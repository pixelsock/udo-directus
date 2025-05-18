---
trigger: always_on
---

# Rule: Always Search Relevant Documentation using available MCP tools.

**Purpose:**
To ensure all code changes are accurate, maintainable, and in line with best practices, you must always search and explore the relevant github documentation provided via your mcp tools before making, proposing, or explaining any code changes.

**Scope:**
- Applies to all code edits, refactors, and new feature implementations.
- Applies to all frameworks, libraries, and platforms in use (e.g., Directus, TipTap, Vue, etc).

**How to Apply:**
1. Before making a change, search the official documentation for the relevant technology or API.
2. Summarize or cite the relevant doc section(s) in your reasoning or explanation.
3. If a best practice or warning is present in the docs, follow it or explain any deviation.
4. If the docs are ambiguous or lacking, note this and use community best practices.

**Example:**
- When adding a new TipTap node: consult the [TipTap custom node docs](https://tiptap.dev/guide/custom-extensions) and cite them in your summary.
- When using Directus SDK: reference the [Directus SDK docs](https://docs.directus.io/reference/sdk/) for correct usage.

**Enforcement:**
- All code changes must include a brief note on which documentation was referenced and what guidance was followed.

---

*This rule is mandatory for all future work in this project.*
