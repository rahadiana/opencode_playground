# OpenCode SDK Reference

Complete documentation of all opencode SDK features with real types, code examples, and JSON input/output.

## Table of Contents

- [Setup](#setup)
- [Session API](#session-api)
- [Config API](#config-api)
- [Providers API](#providers-api)
- [Path API](#path-api)
- [VCS API](#vcs-api)
- [Find API](#find-api)
- [File API](#file-api)
- [Global API](#global-api)
- [App API](#app-api)
- [Auth API](#auth-api)
- [TUI API](#tui-api)
- [PTY API](#pty-api)
- [Events API](#events-api)
- [Events Reference](#events-reference)
- [Plugin Hooks Reference](#plugin-hooks-reference)
- [Type Reference](#type-reference)

---

## Setup

### Install

```bash
npm install @opencode-ai/sdk
```

### Create server + client

```ts
import { createOpencode } from "@opencode-ai/sdk"
const { client, server } = await createOpencode({
  hostname: "127.0.0.1",
  port: 4096,
  config: { model: "anthropic/claude-sonnet-4-20250514" },
})
```

### Create client only (connect to running server)

```ts
import { createOpencodeClient } from "@opencode-ai/sdk"
const client = createOpencodeClient({ baseUrl: "http://localhost:4096" })
```

### Error handling

```ts
try {
  await client.session.get({ path: { id: "invalid-id" } })
} catch (error) {
  console.error((error as Error).message)
}
```

---

## Session API

### session.create()

**Signature:** `client.session.create({ body? })`

**Description:** Create a new session.

**Input:**
```json
{ "body": { "title": "My session", "parentID": "ses_abc123" } }
```

**Output:**
```json
{
  "id": "ses_xyz",
  "projectID": "proj_abc",
  "directory": "/home/user/project",
  "title": "My session",
  "version": "1",
  "time": { "created": 1712345678, "updated": 1712345678 }
}
```

**Code:**
```ts
const session = await client.session.create({ body: { title: "My session" } })
console.log(session.data.id)
```

**Notes:** Optional `parentID` creates a child session.

---

### session.list()

**Signature:** `client.session.list({ query? })`

**Description:** List all sessions.

**Input:**
```json
{ "query": { "directory": "/home/user/project" } }
```

**Output:**
```json
[{ "id": "ses_xyz", "title": "My session", "projectID": "proj_abc", "version": "1", "time": { "created": 1712345678, "updated": 1712345678 } }]
```

**Code:**
```ts
const sessions = await client.session.list()
console.log(sessions.data.length)
```

---

### session.get()

**Signature:** `client.session.get({ path })`

**Description:** Get a single session by ID.

**Input:**
```json
{ "path": { "id": "ses_xyz" } }
```

**Output:**
```json
{ "id": "ses_xyz", "projectID": "proj_abc", "title": "My session", "version": "1", "time": { "created": 1712345678, "updated": 1712345678 } }
```

**Code:**
```ts
const session = await client.session.get({ path: { id: "ses_xyz" } })
console.log(session.data.title)
```

**Notes:** Throws `NotFoundError` if session does not exist.

---

### session.update()

**Signature:** `client.session.update({ path, body })`

**Description:** Update session properties (title).

**Input:**
```json
{ "path": { "id": "ses_xyz" }, "body": { "title": "Updated title" } }
```

**Output:**
```json
{ "id": "ses_xyz", "title": "Updated title", "version": "2", "time": { "created": 1712345678, "updated": 1712345777 } }
```

**Code:**
```ts
const updated = await client.session.update({ path: { id: "ses_xyz" }, body: { title: "New title" } })
console.log(updated.data.version)
```

---

### session.delete()

**Signature:** `client.session.delete({ path })`

**Description:** Delete a session by ID.

**Input:**
```json
{ "path": { "id": "ses_xyz" } }
```

**Output:** `true`

**Code:**
```ts
const success = await client.session.delete({ path: { id: "ses_xyz" } })
```

---

### session.children()

**Signature:** `client.session.children({ path })`

**Description:** List child sessions of a given session.

**Input:**
```json
{ "path": { "id": "ses_xyz" } }
```

**Output:**
```json
[{ "id": "ses_child123", "parentID": "ses_xyz", "title": "Child session", "version": "1", "time": { "created": 1712345777, "updated": 1712345777 } }]
```

**Code:**
```ts
const children = await client.session.children({ path: { id: "ses_xyz" } })
console.log(children.data.length)
```

---

### session.init()

**Signature:** `client.session.init({ path, body })`

**Description:** Analyze the app and create `AGENTS.md`.

**Input:**
```json
{
  "path": { "id": "ses_xyz" },
  "body": { "modelID": "claude-sonnet-4-20250514", "providerID": "anthropic", "messageID": "msg_abc123" }
}
```

**Output:** `true`

**Code:**
```ts
await client.session.init({ path: { id: "ses_xyz" }, body: { modelID: "claude-sonnet-4-20250514", providerID: "anthropic", messageID: "msg_abc123" } })
```

---

### session.abort()

**Signature:** `client.session.abort({ path })`

**Description:** Abort a running session.

**Input:**
```json
{ "path": { "id": "ses_xyz" } }
```

**Output:** `true`

**Code:**
```ts
await client.session.abort({ path: { id: "ses_xyz" } })
```

---

### session.share()

**Signature:** `client.session.share({ path })`

**Description:** Share a session via public URL.

**Input:**
```json
{ "path": { "id": "ses_xyz" } }
```

**Output:**
```json
{ "id": "ses_xyz", "share": { "url": "https://opencode.ai/s/abc123" }, "version": "1", "time": { "created": 1712345678, "updated": 1712345678 } }
```

**Code:**
```ts
const shared = await client.session.share({ path: { id: "ses_xyz" } })
console.log(shared.data.share?.url)
```

---

### session.unshare()

**Signature:** `client.session.unshare({ path })`

**Description:** Remove sharing from a session.

**Input:**
```json
{ "path": { "id": "ses_xyz" } }
```

**Output:**
```json
{ "id": "ses_xyz", "version": "1", "time": { "created": 1712345678, "updated": 1712345678 } }
```

**Code:**
```ts
await client.session.unshare({ path: { id: "ses_xyz" } })
```

---

### session.summarize()

**Signature:** `client.session.summarize({ path, body })`

**Description:** Generate session summary using a model.

**Input:**
```json
{
  "path": { "id": "ses_xyz" },
  "body": { "providerID": "anthropic", "modelID": "claude-sonnet-4-20250514" }
}
```

**Output:** `true`

**Code:**
```ts
await client.session.summarize({ path: { id: "ses_xyz" }, body: { providerID: "anthropic", modelID: "claude-sonnet-4-20250514" } })
```

---

### session.prompt()

**Signature:** `client.session.prompt({ path, body })`

**Description:** Send a prompt to a session and get AI response.

**Input (normal):**
```json
{
  "path": { "id": "ses_xyz" },
  "body": {
    "parts": [{ "type": "text", "text": "List all files" }],
    "model": { "providerID": "anthropic", "modelID": "claude-sonnet-4-20250514" },
    "agent": "build"
  }
}
```

**Output:**
```json
{
  "info": {
    "id": "msg_resp_001", "sessionID": "ses_xyz", "role": "assistant",
    "parentID": "msg_user_001",
    "modelID": "claude-sonnet-4-20250514", "providerID": "anthropic",
    "mode": "build",
    "cost": 0.0025,
    "tokens": { "input": 150, "output": 200, "reasoning": 0, "cache": { "read": 0, "write": 0 } },
    "finish": "stop"
  },
  "parts": [{ "id": "part_001", "type": "text", "text": "Here are the files..." }]
}
```

**Code:**
```ts
const result = await client.session.prompt({
  path: { id: "ses_xyz" },
  body: { parts: [{ type: "text", text: "Hello!" }] },
})
console.log(result.data.info.tokens.input)
```

---

#### session.prompt() — noReply mode

**Description:** Inject context without triggering AI response. Useful for plugins.

**Input:**
```json
{
  "path": { "id": "ses_xyz" },
  "body": {
    "noReply": true,
    "parts": [{ "type": "text", "text": "Context for next turn." }]
  }
}
```

**Output:** Returns `UserMessage` (not `AssistantMessage`).

**Code:**
```ts
await client.session.prompt({
  path: { id: "ses_xyz" },
  body: { noReply: true, parts: [{ type: "text", text: "context" }] },
})
```

---

#### session.prompt() — Structured Output

**Description:** Request validated JSON output via JSON schema.

**Input:**
```json
{
  "path": { "id": "ses_xyz" },
  "body": {
    "parts": [{ "type": "text", "text": "Extract company info" }],
    "format": {
      "type": "json_schema",
      "schema": {
        "type": "object",
        "properties": {
          "company": { "type": "string" },
          "founded": { "type": "number" },
          "products": { "type": "array", "items": { "type": "string" } }
        },
        "required": ["company", "founded"]
      }
    }
  }
}
```

**Output:**
```json
{
  "info": { "id": "msg_resp_001", "structured_output": { "company": "Anthropic", "founded": 2021, "products": ["Claude"] } }
}
```

**Code:**
```ts
const result = await client.session.prompt({
  path: { id: sessionId },
  body: {
    parts: [{ type: "text", text: "Extract company info" }],
    format: { type: "json_schema", schema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] } },
  },
})
console.log(result.data.info.structured_output)
```

**Notes:** `format.type` can be `"text"` or `"json_schema"`. Retries up to `retryCount` (default 2) on validation failure.

---

### session.command()

**Signature:** `client.session.command({ path, body })`

**Description:** Execute a registered slash-command.

**Input:**
```json
{
  "path": { "id": "ses_xyz" },
  "body": { "command": "explain", "arguments": "DI pattern" }
}
```

**Output:**
```json
{
  "info": { "id": "msg_resp_001", "role": "assistant", "modelID": "claude-sonnet-4-20250514", "cost": 0.001 },
  "parts": [{ "id": "part_001", "type": "text", "text": "Dependency injection is..." }]
}
```

**Code:**
```ts
const result = await client.session.command({
  path: { id: "ses_xyz" },
  body: { command: "explain", arguments: "DI pattern" },
})
console.log(result.data.info.cost)
```

---

### session.shell()

**Signature:** `client.session.shell({ path, body })`

**Description:** Run a shell command in session context.

**Input:**
```json
{
  "path": { "id": "ses_xyz" },
  "body": { "command": "ls -la", "agent": "build" }
}
```

**Output:** Returns `AssistantMessage` directly (not wrapped in `{ info, parts }`).

**Code:**
```ts
const result = await client.session.shell({ path: { id: "ses_xyz" }, body: { command: "npm test" } })
```

---

### session.status()

**Signature:** `client.session.status()`

**Description:** Get status of all active sessions.

**Input:** `{}`

**Output:**
```json
{
  "ses_xyz": { "type": "idle" },
  "ses_abc": { "type": "busy" },
  "ses_def": { "type": "retry", "attempt": 2, "message": "Rate limited", "next": 1719000200000 }
}
```

**Code:**
```ts
const statuses = await client.session.status()
for (const [id, status] of Object.entries(statuses.data)) {
  console.log(`${id}: ${status.type}`)
}
```

---

### session.messages()

**Signature:** `client.session.messages({ path, query? })`

**Description:** List all messages in a session.

**Input:**
```json
{ "path": { "id": "ses_xyz" }, "query": { "limit": 50 } }
```

**Output:**
```json
[{
  "info": { "id": "msg_001", "sessionID": "ses_xyz", "role": "user", "time": { "created": 1719000000000 } },
  "parts": [{ "id": "part_001", "type": "text", "text": "Hello!" }]
}]
```

**Code:**
```ts
const messages = await client.session.messages({ path: { id: "ses_xyz" } })
for (const msg of messages.data) console.log(msg.info.role, msg.info.id)
```

---

### session.message()

**Signature:** `client.session.message({ path })`

**Description:** Get a single message by session ID and message ID.

**Input:**
```json
{ "path": { "id": "ses_xyz", "messageID": "msg_001" } }
```

**Output:**
```json
{
  "info": { "id": "msg_001", "sessionID": "ses_xyz", "role": "user" },
  "parts": [{ "id": "part_001", "type": "text", "text": "Hello!" }]
}
```

**Code:**
```ts
const msg = await client.session.message({ path: { id: "ses_xyz", messageID: "msg_001" } })
console.log(msg.data.info.role)
```

---

### session.revert()

**Signature:** `client.session.revert({ path, body })`

**Description:** Revert session to a previous state.

**Input:**
```json
{
  "path": { "id": "ses_xyz" },
  "body": { "messageID": "msg_bad", "partID": "part_010" }
}
```

**Output:**
```json
{ "id": "ses_xyz", "revert": { "messageID": "msg_bad", "partID": "part_010" }, "time": { "updated": 1719000100000 } }
```

**Code:**
```ts
const result = await client.session.revert({ path: { id: "ses_xyz" }, body: { messageID: "msg_bad" } })
console.log(result.data.revert?.messageID)
```

---

### session.unrevert()

**Signature:** `client.session.unrevert({ path })`

**Description:** Restore reverted messages.

**Input:**
```json
{ "path": { "id": "ses_xyz" } }
```

**Output:**
```json
{ "id": "ses_xyz", "time": { "updated": 1719000150000 } }
```

**Code:**
```ts
await client.session.unrevert({ path: { id: "ses_xyz" } })
```

---

### session.todo()

**Signature:** `client.session.todo({ path })`

**Description:** Get the todo list for a session.

**Input:**
```json
{ "path": { "id": "ses_xyz" } }
```

**Output:**
```json
[{ "content": "Fix bug", "status": "in_progress", "priority": "high", "id": "todo_001" }]
```

**Code:**
```ts
const todos = await client.session.todo({ path: { id: "ses_xyz" } })
for (const t of todos.data) console.log(`[${t.status}] ${t.content}`)
```

---

### postSessionByIdPermissionsByPermissionId()

**Signature:** `client.postSessionByIdPermissionsByPermissionId({ path, body })`

**Description:** Respond to a permission prompt.

**Input:**
```json
{
  "path": { "id": "ses_xyz", "permissionID": "perm_001" },
  "body": { "response": "once" }
}
```

**Output:** `true`

**Code:**
```ts
await client.postSessionByIdPermissionsByPermissionId({
  path: { id: "ses_xyz", permissionID: "perm_001" },
  body: { response: "once" },
})
```

**Notes:** `response` values: `"once"`, `"always"`, `"reject"`.

---

## Config API

### config.get()

**Signature:** `client.config.get({ query? })`

**Description:** Get the full active configuration.

**Input:**
```json
{ "query": { "directory": "/path/to/project" } }
```

**Output:**
```json
{
  "model": "anthropic/claude-sonnet-4-20250514",
  "theme": "dark",
  "agent": { "build": { "model": "anthropic/claude-sonnet-4-20250514" } },
  "permission": { "edit": "allow", "bash": "ask" },
  "logLevel": "INFO"
}
```

**Code:**
```ts
const config = await client.config.get()
console.log(config.data.model)
```

---

### config.update()

**Signature:** `client.config.update({ body })`

**Description:** Update configuration at runtime.

**Input:**
```json
{ "body": { "model": "openai/gpt-4o", "theme": "light" } }
```

**Output:** Returns the full updated `Config`.

**Code:**
```ts
await client.config.update({ body: { model: "openai/gpt-4o" } })
```

**Notes:** Only provided fields are written; omitted fields are left unchanged.

---

### config.providers()

**Signature:** `client.config.providers({ query? })`

**Description:** List all configured providers and their models.

**Input:**
```json
{ "query": { "directory": "/path/to/project" } }
```

**Output:**
```json
{
  "providers": [{
    "id": "anthropic", "name": "Anthropic", "source": "env",
    "env": ["ANTHROPIC_API_KEY"],
    "models": {
      "claude-sonnet-4-20250514": {
        "id": "claude-sonnet-4-20250514", "providerID": "anthropic",
        "name": "Claude Sonnet 4",
        "api": { "id": "anthropic", "url": "https://api.anthropic.com/v1", "npm": "@anthropic-ai/sdk" },
        "capabilities": { "temperature": true, "reasoning": true, "attachment": true, "toolcall": true, "input": { "text": true, "image": true, "pdf": true }, "output": { "text": true } },
        "cost": { "input": 3, "output": 15, "cache": { "read": 0.3, "write": 3.75 } },
        "limit": { "context": 200000, "output": 8192 },
        "status": "active", "options": {}, "headers": {}
      }
    }
  }],
  "default": { "plan": "anthropic/claude-sonnet-4-20250514", "build": "anthropic/claude-sonnet-4-20250514" }
}
```

**Code:**
```ts
const { providers, default: defaults } = (await client.config.providers()).data
for (const p of providers) {
  console.log(`${p.name}`)
  for (const [id, m] of Object.entries(p.models)) {
    console.log(`  ${id} — ${m.name} (${m.status})`)
  }
}
```

---

## Path API

### path.get()

**Signature:** `client.path.get({ query? })`

**Description:** Get workspace paths.

**Input:**
```json
{}
```

**Output:**
```json
{
  "state": "/home/user/.local/share/opencode",
  "config": "/home/user/.config/opencode",
  "worktree": "/home/user/project",
  "directory": "/home/user/project"
}
```

**Code:**
```ts
const p = await client.path.get()
console.log(p.data.worktree)
```

---

## VCS API

### vcs.get()

**Signature:** `client.vcs.get({ query? })`

**Description:** Get VCS info (git branch).

**Input:**
```json
{}
```

**Output:**
```json
{ "branch": "main" }
```

**Code:**
```ts
const vcs = await client.vcs.get()
console.log(vcs.data.branch)
```

---

## Find API

### find.text()

**Signature:** `client.find.text({ query })`

**Description:** Search for text in files using regex.

**Input:**
```json
{ "query": { "pattern": "function.*hello", "directory": "/home/user/project" } }
```

**Output:**
```json
[{
  "path": { "text": "src/index.ts" },
  "lines": { "text": "function hello() {" },
  "line_number": 42,
  "absolute_offset": 1034,
  "submatches": [{ "match": { "text": "function hello" }, "start": 2, "end": 16 }]
}]
```

**Code:**
```ts
const results = await client.find.text({ query: { pattern: "TODO|FIXME" } })
for (const m of results.data) console.log(`${m.path.text}:${m.line_number} ${m.lines.text}`)
```

---

### find.files()

**Signature:** `client.find.files({ query })`

**Description:** Find files/directories by name (glob pattern).

**Input:**
```json
{ "query": { "query": "*.ts", "type": "file", "limit": 50 } }
```

**Output:**
```json
["src/index.ts", "src/utils.ts", "test/main.test.ts"]
```

**Code:**
```ts
const files = await client.find.files({ query: { query: "*.ts", type: "file" } })
console.log(files.data)
```

**Notes:** `type` can be `"file"` or `"directory"`. `limit` caps results (1–200).

---

### find.symbols()

**Signature:** `client.find.symbols({ query })`

**Description:** Find workspace symbols using LSP.

**Input:**
```json
{ "query": { "query": "hello" } }
```

**Output:**
```json
[{
  "name": "hello",
  "kind": 12,
  "location": { "uri": "file:///home/user/project/src/index.ts", "range": { "start": { "line": 0, "character": 9 }, "end": { "line": 0, "character": 14 } } }
}]
```

**Code:**
```ts
const symbols = await client.find.symbols({ query: { query: "hello" } })
```

**Notes:** Kind is an LSP SymbolKind integer (12 = Function). Requires active LSP server.

---

## File API

### file.read()

**Signature:** `client.file.read({ query })`

**Description:** Read a file's content.

**Input:**
```json
{ "query": { "path": "src/index.ts" } }
```

**Output:**
```json
{
  "type": "text",
  "content": "import { createOpencode } from \"@opencode-ai/sdk\"\n",
  "diff": "@@ -1,3 +1,5 @@\n...",
  "mimeType": "text/typescript"
}
```

**Code:**
```ts
const file = await client.file.read({ query: { path: "src/index.ts" } })
console.log(file.data.content)
```

**Notes:** `type` is `"text"` or `"binary"`. Binary files have `encoding: "base64"`.

---

### file.status()

**Signature:** `client.file.status({ query? })`

**Description:** Get git status for tracked files.

**Input:**
```json
{}
```

**Output:**
```json
[{ "path": "src/index.ts", "added": 15, "removed": 3, "status": "modified" }]
```

**Code:**
```ts
const statuses = await client.file.status()
for (const f of statuses.data) console.log(`${f.status}: ${f.path} (+${f.added}/-${f.removed})`)
```

---

## Global API

### global.health()

**Signature:** `client.global.health()`

**Description:** Check server health.

**Input:** `{}`

**Output:**
```json
{ "healthy": true, "version": "0.0.0" }
```

**Code:**
```ts
const health = await client.global.health()
console.log(health.data.version)
```

---

## App API

### app.log()

**Signature:** `client.app.log({ body })`

**Description:** Write a structured log entry.

**Input:**
```json
{ "body": { "service": "my-plugin", "level": "info", "message": "Session started", "extra": { "sessionId": "abc" } } }
```

**Output:** `true`

**Code:**
```ts
await client.app.log({ body: { service: "my-plugin", level: "info", message: "Hello" } })
```

**Notes:** `level` can be `"debug"`, `"info"`, `"warn"`, `"error"`.

---

### app.agents()

**Signature:** `client.app.agents()`

**Description:** List all available agents.

**Input:** `{}`

**Output:**
```json
[{
  "name": "build", "description": "Write and run code", "mode": "primary", "builtIn": true,
  "permission": { "edit": "allow", "bash": { "default": "ask" } },
  "tools": { "Bash": true, "Edit": true, "Read": true }
}]
```

**Code:**
```ts
const agents = await client.app.agents()
for (const a of agents.data) console.log(a.name, a.description)
```

---

## Auth API

### auth.set()

**Signature:** `client.auth.set({ path, body })`

**Description:** Set authentication credentials for a provider.

**Input:**
```json
{ "path": { "id": "anthropic" }, "body": { "type": "api", "key": "sk-ant-..." } }
```

**Output:** `true`

**Code:**
```ts
await client.auth.set({ path: { id: "anthropic" }, body: { type: "api", key: "sk-ant-..." } })
```

**Notes:** Also supports OAuth: `{ type: "oauth", access: "...", refresh: "...", expires: 3600 }`.

---

## TUI API

### tui.appendPrompt()

**Signature:** `client.tui.appendPrompt({ body })`

**Description:** Append text to the TUI prompt.

**Input:**
```json
{ "body": { "text": "Refactor this code" } }
```

**Output:** `true`

**Code:**
```ts
await client.tui.appendPrompt({ body: { text: "Add this to prompt" } })
```

---

### tui.clearPrompt()

**Signature:** `client.tui.clearPrompt()`

**Description:** Clear the TUI prompt.

**Input:** `{}` → **Output:** `true`

**Code:** `await client.tui.clearPrompt()`

---

### tui.submitPrompt()

**Signature:** `client.tui.submitPrompt()`

**Description:** Submit the current prompt.

**Input:** `{}` → **Output:** `true`

**Code:** `await client.tui.submitPrompt()`

---

### tui.showToast()

**Signature:** `client.tui.showToast({ body })`

**Description:** Show a toast notification.

**Input:**
```json
{ "body": { "message": "Task done", "variant": "success", "title": "Build", "duration": 3000 } }
```

**Output:** `true`

**Code:**
```ts
await client.tui.showToast({ body: { message: "Task completed", variant: "success" } })
```

**Notes:** `variant` is `"info"`, `"success"`, `"warning"`, or `"error"`.

---

### tui.executeCommand()

**Signature:** `client.tui.executeCommand({ body })`

**Description:** Execute a TUI command programmatically.

**Input:**
```json
{ "body": { "command": "agent.cycle" } }
```

**Output:** `true`

**Code:** `await client.tui.executeCommand({ body: { command: "agent.cycle" } })`

---

### tui.openHelp(), .openSessions(), .openThemes(), .openModels()

**Signature:** `client.tui.openHelp()`

**Description:** Open respective TUI dialogs.

**Input:** `{}` → **Output:** `true`

**Code:**
```ts
await client.tui.openHelp()
await client.tui.openSessions()
await client.tui.openThemes()
await client.tui.openModels()
```

---

## PTY API

### pty.list()

**Signature:** `client.pty.list()`

**Description:** List all active PTY sessions.

**Input:** `{}`

**Output:**
```json
[{ "id": "pty_001", "title": "dev-server", "command": "npm", "args": ["run", "dev"], "cwd": "/home/user/project", "status": "running", "pid": 12345 }]
```

**Code:**
```ts
const ptys = await client.pty.list()
for (const p of ptys.data) console.log(p.title, p.status)
```

---

### pty.create()

**Signature:** `client.pty.create({ body })`

**Description:** Create a new PTY session.

**Input:**
```json
{ "body": { "command": "npm", "args": ["run", "dev"], "title": "dev-server", "cwd": "/home/user/project" } }
```

**Output:**
```json
{ "id": "pty_abc", "title": "dev-server", "command": "npm", "status": "running", "pid": 12346 }
```

**Code:**
```ts
const pty = await client.pty.create({ body: { command: "tail", args: ["-f", "/var/log/syslog"] } })
console.log(pty.data.id)
```

---

### pty.get()

**Signature:** `client.pty.get({ path })`

**Description:** Get PTY info by ID.

**Input:**
```json
{ "path": { "id": "pty_abc" } }
```

**Output:**
```json
{ "id": "pty_abc", "title": "dev-server", "status": "running", "pid": 12346 }
```

**Code:**
```ts
const pty = await client.pty.get({ path: { id: "pty_abc" } })
```

---

### pty.update()

**Signature:** `client.pty.update({ path, body })`

**Description:** Update PTY properties (title, terminal size).

**Input:**
```json
{ "path": { "id": "pty_abc" }, "body": { "title": "renamed", "size": { "rows": 24, "cols": 80 } } }
```

**Code:**
```ts
await client.pty.update({ path: { id: "pty_abc" }, body: { title: "renamed" } })
```

---

### pty.remove()

**Signature:** `client.pty.remove({ path })`

**Description:** Kill and remove a PTY session.

**Input:**
```json
{ "path": { "id": "pty_abc" } }
```

**Output:** `true`

**Code:** `await client.pty.remove({ path: { id: "pty_abc" } })`

---

### pty.connect()

**Signature:** `client.pty.connect({ path })`

**Description:** Connect to PTY I/O stream.

**Input:**
```json
{ "path": { "id": "pty_abc" } }
```

**Output:** `true`

**Code:** `await client.pty.connect({ path: { id: "pty_abc" } })`

---

## Events API

### event.subscribe()

**Signature:** `client.event.subscribe()`

**Description:** Subscribe to a server-sent events (SSE) stream.

**Input:** `{}`

**Output:** Async iterable of events.

**Code:**
```ts
const events = await client.event.subscribe()
for await (const event of events.stream) {
  console.log(event.type, event.properties)
}
```

---

## Events Reference

All event types in the `Event` discriminated union. Each has `type` and `properties`.

### server.instance.disposed
```ts
{ type: "server.instance.disposed"; properties: { directory: string } }
```
Fires when a server instance is disposed.

### installation.updated
```ts
{ type: "installation.updated"; properties: { version: string } }
```
Fires after opencode is updated.

### installation.update-available
```ts
{ type: "installation.update-available"; properties: { version: string } }
```
Fires when a new version is available.

### lsp.client.diagnostics
```ts
{ type: "lsp.client.diagnostics"; properties: { serverID: string; path: string } }
```
Fires when LSP diagnostics are published.

### lsp.updated
```ts
{ type: "lsp.updated"; properties: { [key: string]: unknown } }
```
Fires on LSP state changes.

### message.updated
```ts
{ type: "message.updated"; properties: { info: Message } }
```
Fires when a message is updated. `info` is the full `Message` object.

### message.removed
```ts
{ type: "message.removed"; properties: { sessionID: string; messageID: string } }
```
Fires when a message is removed.

### message.part.updated
```ts
{ type: "message.part.updated"; properties: { part: Part; delta?: string } }
```
Fires when a message part is created/updated. `delta` carries streaming text.

### message.part.removed
```ts
{ type: "message.part.removed"; properties: { sessionID: string; messageID: string; partID: string } }
```
Fires when a message part is removed.

### permission.updated
```ts
{ type: "permission.updated"; properties: Permission }
```
Fires when a permission prompt is created.

### permission.replied
```ts
{ type: "permission.replied"; properties: { sessionID: string; permissionID: string; response: string } }
```
Fires when user responds to a permission prompt.

### session.status
```ts
{ type: "session.status"; properties: { sessionID: string; status: SessionStatus } }
```
Fires when session run status changes (busy/idle/retry).

### session.idle
```ts
{ type: "session.idle"; properties: { sessionID: string } }
```
Fires when a session finishes processing.

### session.compacted
```ts
{ type: "session.compacted"; properties: { sessionID: string } }
```
Fires after session history is compacted.

### file.edited
```ts
{ type: "file.edited"; properties: { file: string } }
```
Fires when a file is edited by AI.

### todo.updated
```ts
{ type: "todo.updated"; properties: { sessionID: string; todos: Array<Todo> } }
```
Fires when the session's todo list changes.

### command.executed
```ts
{ type: "command.executed"; properties: { name: string; sessionID: string; arguments: string; messageID: string } }
```
Fires after a slash-command is executed.

### session.created
```ts
{ type: "session.created"; properties: { info: Session } }
```
Fires when a new session is created.

### session.updated
```ts
{ type: "session.updated"; properties: { info: Session } }
```
Fires when session metadata is updated.

### session.deleted
```ts
{ type: "session.deleted"; properties: { info: Session } }
```
Fires when a session is deleted.

### session.diff
```ts
{ type: "session.diff"; properties: { sessionID: string; diff: Array<FileDiff> } }
```
Fires when session diff is computed.

### session.error
```ts
{ type: "session.error"; properties: { sessionID?: string; error?: ProviderAuthError | UnknownError | MessageOutputLengthError | MessageAbortedError | ApiError } }
```
Fires when a session encounters an error.

### file.watcher.updated
```ts
{ type: "file.watcher.updated"; properties: { file: string; event: "add" | "change" | "unlink" } }
```
Fires on file system changes.

### vcs.branch.updated
```ts
{ type: "vcs.branch.updated"; properties: { branch?: string } }
```
Fires when git branch changes.

### tui.prompt.append
```ts
{ type: "tui.prompt.append"; properties: { text: string } }
```
Fires when text is appended to the TUI prompt.

### tui.command.execute
```ts
{ type: "tui.command.execute"; properties: { command: string } }
```
Fires when a TUI command is executed.

### tui.toast.show
```ts
{ type: "tui.toast.show"; properties: { title?: string; message: string; variant: "info" | "success" | "warning" | "error"; duration?: number } }
```
Fires when a toast notification is shown.

### pty.created
```ts
{ type: "pty.created"; properties: { info: Pty } }
```
Fires when a PTY process is created.

### pty.updated
```ts
{ type: "pty.updated"; properties: { info: Pty } }
```
Fires when a PTY is updated.

### pty.exited
```ts
{ type: "pty.exited"; properties: { id: string; exitCode: number } }
```
Fires when a PTY process exits.

### pty.deleted
```ts
{ type: "pty.deleted"; properties: { id: string } }
```
Fires when a PTY is deleted.

### server.connected
```ts
{ type: "server.connected"; properties: { [key: string]: unknown } }
```
Fires when the server connects.

---

## Plugin Hooks Reference

### Plugin function signature
```ts
import type { Plugin } from "@opencode-ai/plugin"

export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  return {
    // hooks here
  }
}
```

Context: `project` (Project), `client` (SDK client), `$` (Bun shell), `directory` (cwd), `worktree` (git root).

---

### event
```ts
event: async ({ event }: { event: Event }) => void
```
Generic event listener. Inspect `event.type` to discriminate. Catches all events.

**Example:**
```ts
event: async ({ event }) => {
  if (event.type === "session.idle") {
    console.log(`Session ${event.properties.sessionID} finished`)
  }
}
```

---

### config
```ts
config: async (config: Config) => void
```
Called with resolved project configuration. Allows validation/transformation.

---

### tool
```ts
tool: {
  [key: string]: ToolDefinition
}
```
Register AI-callable custom tools.

**Example:**
```ts
import { tool, type Plugin } from "@opencode-ai/plugin"

export const MyPlugin: Plugin = async ({ directory }) => {
  return {
    tool: {
      my_tool: tool({
        description: "Does something",
        args: { query: tool.schema.string().describe("Search query") },
        async execute(args, { sessionID, directory, worktree, abort, metadata, ask }) {
          metadata({ title: "Result" })
          return `Results for: ${args.query}`
        },
      }),
    },
  }
}
```

The `tool()` helper provides:
- `tool.schema` — Zod instance for defining args
- `execute` receives `ToolContext`: `{ sessionID, messageID, agent, directory, worktree, abort, metadata(), ask() }`
- Return `string` or `{ title?, output: string, metadata?, attachments? }`

---

### auth
```ts
auth: {
  provider: string
  loader?: (auth: () => Promise<Auth>, provider: Provider) => Promise<Record<string, any>>
  methods: Array<AuthMethod>
}
```
Register authentication methods for a provider (OAuth or API key).

---

### provider
```ts
provider: {
  id: string
  models?: (provider: ProviderV2, ctx: ProviderHookContext) => Promise<Record<string, ModelV2>>
}
```
Register a custom provider with dynamic model listing.

---

### dispose
```ts
dispose: () => Promise<void>
```
Called when plugin is unloaded. Cleanup listeners, close connections.

---

### chat.message
**Input:** `{ sessionID, agent?, model?, messageID?, variant? }`  
**Output:** `{ message: UserMessage; parts: Part[] }`

Modify user messages before they are processed.

**Example:**
```ts
"chat.message": async (input, output) => {
  output.parts.push({ type: "text", text: " [logged]" })
}
```

---

### chat.params
**Input:** `{ sessionID, agent, model, provider, message }`  
**Output:** `{ temperature, topP, topK, maxOutputTokens, options }`

Modify LLM parameters before API call.

**Example:**
```ts
"chat.params": async (input, output) => {
  output.temperature = 0.3
  output.maxOutputTokens = 4096
}
```

---

### chat.headers
**Input:** `{ sessionID, agent, model, provider, message }`  
**Output:** `{ headers: Record<string, string> }`

Modify HTTP headers sent to LLM provider.

---

### permission.ask
**Input:** `Permission`  
**Output:** `{ status: "ask" | "deny" | "allow" }`

Auto-allow or auto-deny permission requests.

**Example:**
```ts
"permission.ask": async (input, output) => {
  if (input.type === "read") output.status = "allow"
}
```

---

### command.execute.before
**Input:** `{ command, sessionID, arguments }`  
**Output:** `{ parts: Part[] }`

Inject synthetic parts before a slash-command executes.

---

### tool.execute.before
**Input:** `{ tool, sessionID, callID }`  
**Output:** `{ args: any }`

Modify tool arguments before execution.

---

### shell.env
**Input:** `{ cwd, sessionID?, callID? }`  
**Output:** `{ env: Record<string, string> }`

Inject environment variables into shell commands.

**Example:**
```ts
"shell.env": async (input, output) => {
  output.env.MY_VAR = "value"
}
```

---

### tool.execute.after
**Input:** `{ tool, sessionID, callID, args }`  
**Output:** `{ title, output, metadata }`

Modify tool result after execution.

---

### experimental.session.compacting
**Input:** `{ sessionID }`  
**Output:** `{ context: string[]; prompt?: string }`

Customize session compaction. `context` strings are appended to default prompt; setting `prompt` replaces it entirely.

---

### experimental.compaction.autocontinue
**Input:** `{ sessionID, agent, model, provider, message, overflow }`  
**Output:** `{ enabled: boolean }`

Skip auto-continue after compaction.

---

### tool.definition
**Input:** `{ toolID }`  
**Output:** `{ description: string; parameters: any }`

Override tool descriptions/parameters sent to the LLM.

---

## Type Reference

### Session
```ts
{
  id: string
  projectID: string
  directory: string
  parentID?: string
  summary?: { additions: number; deletions: number; files: number; diffs?: FileDiff[] }
  share?: { url: string }
  title: string
  version: string
  time: { created: number; updated: number; compacting?: number }
  revert?: { messageID: string; partID?: string; snapshot?: string; diff?: string }
}
```

### UserMessage
```ts
{ id: string; sessionID: string; role: "user"; time: { created: number }; summary?: { title?, body?, diffs: FileDiff[] }; agent: string; model: { providerID: string; modelID: string }; system?: string; tools?: { [key: string]: boolean } }
```

### AssistantMessage
```ts
{ id: string; sessionID: string; role: "assistant"; time: { created: number; completed?: number }; error?: ErrorType; parentID: string; modelID: string; providerID: string; mode: string; path: { cwd: string; root: string }; summary?: boolean; cost: number; tokens: { input: number; output: number; reasoning: number; cache: { read: number; write: number } }; finish?: string }
```

### Message
`UserMessage | AssistantMessage` — discriminated by `role`.

### Part variants
`Part = TextPart | SubtaskPart | ReasoningPart | FilePart | ToolPart | StepStartPart | StepFinishPart | SnapshotPart | PatchPart | AgentPart | RetryPart | CompactionPart`

| Type | Discriminant | Key fields |
|---|---|---|
| TextPart | `type: "text"` | `text`, `synthetic?`, `ignored?` |
| ReasoningPart | `type: "reasoning"` | `text` (chain-of-thought) |
| FilePart | `type: "file"` | `mime`, `url`, `source?` |
| ToolPart | `type: "tool"` | `callID`, `tool`, `state` |
| StepStartPart | `type: "step-start"` | `snapshot?` |
| StepFinishPart | `type: "step-finish"` | `reason`, `cost`, `tokens` |
| SnapshotPart | `type: "snapshot"` | `snapshot` (hash) |
| PatchPart | `type: "patch"` | `hash`, `files[]` |
| AgentPart | `type: "agent"` | `name`, `source?` |
| RetryPart | `type: "retry"` | `attempt`, `error` |
| CompactionPart | `type: "compaction"` | `auto` |
| SubtaskPart | `type: "subtask"` | `prompt`, `description`, `agent` |

### ToolState
```ts
{ status: "pending"; input: {}; raw: string }
| { status: "running"; input: {}; title?: string; metadata?: {}; time: { start } }
| { status: "completed"; input: {}; output: string; title: string; metadata: {}; time: { start, end, compacted? }; attachments?: FilePart[] }
| { status: "error"; input: {}; error: string; time: { start, end } }
```

### Model
```ts
{
  id: string; providerID: string
  api: { id: string; url: string; npm: string }
  name: string
  capabilities: { temperature: boolean; reasoning: boolean; attachment: boolean; toolcall: boolean; input: { text, audio, image, video, pdf }; output: { text, audio, image, video, pdf } }
  cost: { input: number; output: number; cache: { read: number; write: number }; experimentalOver200K?: { ... } }
  limit: { context: number; output: number }
  status: "alpha" | "beta" | "deprecated" | "active"
  options: {}; headers: {}
}
```

### Provider
```ts
{ id: string; name: string; source: "env" | "config" | "custom" | "api"; env: string[]; key?: string; options: {}; models: { [modelId: string]: Model } }
```

### Project
```ts
{ id: string; worktree: string; vcsDir?: string; vcs?: "git"; time: { created: number; initialized?: number } }
```

### Permission
```ts
{ id: string; type: string; pattern?: string | string[]; sessionID: string; messageID: string; callID?: string; title: string; metadata: {}; time: { created: number } }
```

### Todo
```ts
{ content: string; status: string; priority: string; id: string }
```

### FileDiff
```ts
{ file: string; before: string; after: string; additions: number; deletions: number }
```

### FileContent
```ts
{ type: "text" | "binary"; content: string; diff?: string; patch?: { oldFileName, newFileName, oldHeader?, newHeader?, hunks: [{ oldStart, oldLines, newStart, newLines, lines }] }; encoding?: "base64"; mimeType?: string }
```

### File (status)
```ts
{ path: string; added: number; removed: number; status: "added" | "deleted" | "modified" }
```

### Symbol
```ts
{ name: string; kind: number; location: { uri: string; range: Range } }
```

### Agent
```ts
{ name: string; description?: string; mode: "subagent" | "primary" | "all"; builtIn: boolean; topP?: number; temperature?: number; color?: string; permission: { edit, bash, webfetch?, doom_loop?, external_directory? }; model?: { modelID, providerID }; prompt?: string; tools: { [key: string]: boolean }; options: {}; maxSteps?: number }
```

### Pty
```ts
{ id: string; title: string; command: string; args: string[]; cwd: string; status: "running" | "exited"; pid: number }
```

### Path
```ts
{ state: string; config: string; worktree: string; directory: string }
```

### VcsInfo
```ts
{ branch: string }
```

### Auth
```ts
{ type: "oauth"; refresh: string; access: string; expires: number; enterpriseUrl?: string }
| { type: "api"; key: string; metadata?: {} }
| { type: "wellknown"; key: string; token: string }
```

### SessionStatus
```ts
{ type: "idle" } | { type: "retry"; attempt: number; message: string; next: number } | { type: "busy" }
```

### Error types
| Name | Fields |
|---|---|
| `ProviderAuthError` | `providerID`, `message` |
| `UnknownError` | `message` |
| `MessageOutputLengthError` | `{}` |
| `MessageAbortedError` | `message` |
| `ApiError` | `message`, `statusCode?`, `isRetryable`, `responseHeaders?`, `responseBody?` |
| `BadRequestError` | `message`, `kind?` ("Params" \| "Headers" \| "Query" \| "Body" \| "Payload") |
| `NotFoundError` | `message` |
