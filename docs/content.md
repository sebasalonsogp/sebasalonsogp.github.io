# Project content

One Markdown file in `src/content/projects/` represents one project. Use a stable lowercase, hyphen-separated filename such as `project-name.md`. Its filename supplies the collection identifier and will supply the public URL in Phase 2. Do not rename a published identifier without planning its redirect.

```yaml
---
title: Example project
summary: A concise, factual explanation of what the project does.
technologies:
  - TypeScript
order: 10
draft: true
# role: Optional verified contribution
# repositoryUrl: https://github.com/OWNER/REPOSITORY
# demoUrl: https://YOUR-VERIFIED-DEMO
---
```

The body is Markdown for the future detail page. Explain the problem, your contribution, technical decisions, and evidence. Do not invent results to fill a section.

The schema validates title, summary, technologies, order, optional role, and HTTP(S) repository/demo URLs. `draft` defaults to `true`; only an explicit `draft: false` enters the visible collection query. Verify facts and destinations before changing that flag.

There is currently one draft example and no published project. The foundation renders a simple index from non-draft entries. Detail routes, body rendering, and the scene are later slices; adding a file today does not produce a complete planet visit.

The future explorer, readable index, and detail pages must consume the same collection. Adding or removing a project must not require a hard-coded planet in a component. Keep texture and orbital layout choices out of the content schema until the first scene demonstrates what is actually needed.

No demo URL means no Land link. Use an honest source or walkthrough action once that presentation exists; never insert a dummy destination that appears live.
