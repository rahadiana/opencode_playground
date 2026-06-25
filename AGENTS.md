# Plugin Development Instructions

When working on opencode plugins, always browse the official documentation first:

- **Documentation**: <https://opencode.ai/docs>
- **Plugins**: <https://opencode.ai/docs/plugins/>
- **SDK**: <https://opencode.ai/docs/sdk/>
- **Config Schema**: <https://opencode.ai/config.json>

Use the `webfetch` tool to retrieve the latest plugin API reference, hook
surface, and type definitions from the docs before writing or modifying any
plugin code. Do not rely on prior knowledge — the API may have changed.

When using the SDK `client` in plugin tools, first dump the raw response with
`JSON.stringify(await client.<method>())` to inspect the structure before
building parsing logic — the return value may be wrapped (e.g. `{ data: ... }`).

## Plugin Architecture: Tools vs Hooks

There are two ways to build plugins:

1. **Tools** (`tool: { name: ... }`) — registered as AI-callable tools. The AI
   invokes them explicitly. Use for on-demand actions (e.g. list models,
   query data).

2. **Hooks (Events)** — fire automatically on lifecycle events. Use for
   passive tracking, logging, validation, or side effects. No AI invocation
   needed.

### Available Hook Events

| Event | Fires when |
|---|---|
| `session.created` | A new session starts |
| `session.updated` | Session state changes |
| `session.idle` | Session finishes (idle) |
| `session.error` | Session errors |
| `session.deleted` | Session removed |
| `session.diff` | Session diff computed |
| `session.compacted` | Session compaction done |
| `session.status` | Session status change |
| `message.updated` / `message.removed` / `message.part.updated` / `message.part.removed` | Message changes |
| `tool.execute.before` / `tool.execute.after` | Tool call lifecycle |
| `command.executed` | A slash-command ran |
| `file.edited` / `file.watcher.updated` | File changes |
| `lsp.client.diagnostics` / `lsp.updated` | LSP diagnostics |
| `permission.asked` / `permission.replied` | Permission prompts |
| `server.connected` | Server connection |
| `installation.updated` | Installation update |
| `shell.env` | Shell environment injection |
| `tui.prompt.append` / `tui.command.execute` / `tui.toast.show` | TUI events |
| `todo.updated` | Todo list changed |

### Hook Signature

Named hooks receive `(input, output)`:
```ts
"session.idle": async (input, output) => {
  // input: event payload
  // output: mutable object (some hooks support modification)
}
```

Generic event listener:
```ts
event: async ({ event }) => {
  if (event.type === "session.idle") {
    // event.data: payload
  }
}
```

### Plugin Function Signature

```ts
import type { Plugin } from "@opencode-ai/plugin"

export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  return {
    // hooks here
  }
}
```

The context provides:
- `project` — current project info
- `directory` — working directory
- `worktree` — git worktree path
- `client` — opencode SDK client
- `$` — Bun shell API

### Best Practices

- Use `client.app.log()` for structured logging (level: `debug`, `info`, `warn`, `error`)
  instead of `console.log`.
- Keep hooks lightweight — they run synchronously in the main flow.
- For tracking/accumulation, store state in module-level closures.
- Always dump raw SDK response with `JSON.stringify(await client.method())`
  before building parsing logic.
