# Plugin Development Instructions

When working on opencode plugins, always browse the official documentation first:

- **Documentation**: <https://opencode.ai/docs>
- **Config Schema**: <https://opencode.ai/config.json>

Use the `webfetch` tool to retrieve the latest plugin API reference, hook
surface, and type definitions from the docs before writing or modifying any
plugin code. Do not rely on prior knowledge — the API may have changed.

When using the SDK `client` in plugin tools, first dump the raw response with
`JSON.stringify(await client.<method>())` to inspect the structure before
building parsing logic — the return value may be wrapped (e.g. `{ data: ... }`).
