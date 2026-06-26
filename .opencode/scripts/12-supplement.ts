/**
 * ==========================================================
 *  SDK Methods Supplement — APIs yg Belum Tercakup
 * ==========================================================
 *
 * Nge-cover semua method SDK yg belum ada di script 01-11.
 * Lengkap dari hasil inspect SDK types.
 *
 * Daftar API yg di-cover:
 *   - Project: list, current
 *   - Session: diff, promptAsync
 *   - Command: list
 *   - Provider: list, auth, oauth
 *   - Tool: ids, list
 *   - Instance: dispose
 *   - File: list
 *   - MCP: status, add, connect, disconnect, auth
 *   - LSP: status
 *   - Formatter: status
 */

import type { OpencodeClient } from "@opencode-ai/sdk"

// ===================================================================
//  1. PROJECT API
// ===================================================================
/**
 * Signature:
 *   client.project.list()     → Project[]
 *   client.project.current()  → Project
 *
 * Project type:
 *   { id: string; worktree: string; vcsDir?: string; vcs?: "git"; time: { created: number; initialized?: number } }
 */
export async function projectList(client: OpencodeClient) {
  const r = await (client as any).project.list()
  for (const p of r.data ?? []) {
    console.log(`Project: ${p.id} @ ${p.worktree} (vcs: ${p.vcs ?? "-"})`)
  }
}

export async function projectCurrent(client: OpencodeClient) {
  const r = await (client as any).project.current()
  console.log("Current project:", r.data?.id, r.data?.worktree)
}

// ===================================================================
//  2. SESSION — diff & promptAsync
// ===================================================================
/**
 * session.diff()
 *   Dapatkan file diff dari session.
 *   Output: { file: string; before: string; after: string; additions: number; deletions: number }[]
 *
 * session.promptAsync()
 *   Kirim prompt dan return langsung (gak nunggu AI selesai).
 *   Berguna buat fire-and-forget.
 */
export async function sessionDiff(client: OpencodeClient, sessionId: string) {
  const r = await client.session.diff({ path: { id: sessionId } }) as any
  for (const d of r.data ?? []) {
    console.log(`Diff: ${d.file} (+${d.additions}/-${d.deletions})`)
  }
}

export async function sessionPromptAsync(client: OpencodeClient, sessionId: string) {
  const r = await client.session.promptAsync({
    path: { id: sessionId },
    body: {
      parts: [{ type: "text" as const, text: "Refactor this code" }],
    },
  }) as any
  console.log("promptAsync:", r.data)
}

// ===================================================================
//  3. COMMAND API
// ===================================================================
/**
 * Signature:
 *   client.command.list()  → CommandInfo[]
 *
 * List semua slash-command yg terdaftar (built-in + custom).
 */
export async function commandList(client: OpencodeClient) {
  const r = await (client as any).command.list()
  for (const cmd of r.data ?? []) {
    console.log(`Command: /${cmd.name ?? cmd.command ?? "?"}`)
  }
}

// ===================================================================
//  4. PROVIDER API
// ===================================================================
/**
 * Signature:
 *   client.provider.list()               → Provider[]
 *   client.provider.auth()               → AuthMethod[]
 *   client.provider.oauth.authorize()    → OAuth URL
 *   client.provider.oauth.callback()     → Handle OAuth callback
 *
 * Provider type:
 *   { id: string; name: string; source: "env"|"config"|"custom"|"api"; env: string[]; models: {...} }
 */
export async function providerList(client: OpencodeClient) {
  const r = await (client as any).provider.list()
  for (const p of r.data ?? []) {
    const modelCount = Object.keys(p.models ?? {}).length
    console.log(`Provider: ${p.name} (${p.id}) — ${modelCount} models, source: ${p.source}`)
  }
}

export async function providerAuth(client: OpencodeClient) {
  const r = await (client as any).provider.auth()
  console.log("Auth methods:", r.data)
}

export async function providerOAuthAuthorize(client: OpencodeClient, providerId: string) {
  const r = await (client as any).provider.oauth.authorize({
    path: { id: providerId },
    body: { redirectURI: "http://localhost:4096/callback" },
  })
  console.log("OAuth URL:", r.data?.url ?? r.data)
}

// ===================================================================
//  5. TOOL API
// ===================================================================
/**
 * Signature:
 *   client.tool.ids()              → string[] (tool names)
 *   client.tool.list({ body })     → tool definitions with JSON schema
 *
 * Berguna buat inspect tool apa aja yg available di runtime.
 */
export async function toolIds(client: OpencodeClient) {
  const r = await (client as any).tool.ids()
  console.log("Tool IDs:", r.data)
}

export async function toolList(client: OpencodeClient, providerId: string, modelId: string) {
  const r = await (client as any).tool.list({
    body: { providerID: providerId, modelID: modelId },
  })
  for (const t of r.data ?? []) {
    console.log(`Tool: ${t.name ?? t.id ?? "?"} — ${t.description ?? ""}`)
  }
}

// ===================================================================
//  6. INSTANCE API
// ===================================================================
/**
 * Signature:
 *   client.instance.dispose()
 *
 * Dispose server instance. Server akan mati.
 */
export async function instanceDispose(client: OpencodeClient) {
  await (client as any).instance.dispose()
  console.log("Instance disposed")
}

// ===================================================================
//  7. FILE — list
// ===================================================================
/**
 * Signature:
 *   client.file.list({ query })   → string[] (daftar path file/directory)
 *
 * List file dan directory. Bisa filter pake pattern.
 */
export async function fileList(client: OpencodeClient, dir: string = ".") {
  const r = await (client as any).file.list({ query: { path: dir } })
  console.log(`Files in ${dir}:`, r.data)
}

// ===================================================================
//  8. MCP API
// ===================================================================
/**
 * Signature:
 *   client.mcp.status()            → MCP server status
 *   client.mcp.add({ body })       → Add MCP server dynamically
 *   client.mcp.connect({ path })   → Connect MCP server
 *   client.mcp.disconnect({ path }) → Disconnect MCP server
 *   client.mcp.auth.*              → MCP auth methods
 *
 * MCP = Model Context Protocol. Buat konek ke external tools/database.
 */
export async function mcpStatus(client: OpencodeClient) {
  const r = await (client as any).mcp.status()
  console.log("MCP status:", r.data)
}

export async function mcpAdd(client: OpencodeClient, name: string, command: string, args: string[]) {
  const r = await (client as any).mcp.add({
    body: { name, command, args },
  })
  console.log("MCP added:", r.data)
}

export async function mcpConnect(client: OpencodeClient, serverId: string) {
  await (client as any).mcp.connect({ path: { id: serverId } })
  console.log("MCP connected:", serverId)
}

export async function mcpDisconnect(client: OpencodeClient, serverId: string) {
  await (client as any).mcp.disconnect({ path: { id: serverId } })
  console.log("MCP disconnected:", serverId)
}

// ===================================================================
//  9. LSP API
// ===================================================================
/**
 * Signature:
 *   client.lsp.status()   → LSP server status
 *
 * LSP = Language Server Protocol. Status server buat syntax highlight,
 * diagnostics, autocomplete, dll.
 */
export async function lspStatus(client: OpencodeClient) {
  const r = await (client as any).lsp.status()
  console.log("LSP status:", r.data)
}

// ===================================================================
//  10. FORMATTER API
// ===================================================================
/**
 * Signature:
 *   client.formatter.status()  → Formatter status
 *
 * Cek apakah formatter (prettier, dll) aktif.
 */
export async function formatterStatus(client: OpencodeClient) {
  const r = await (client as any).formatter.status()
  console.log("Formatter status:", r.data)
}

// ===================================================================
//  11. TYPE REFERENCE CONSOLIDATED
// ===================================================================
/**
 * Semua tipe penting dari SDK, berguna buat referensi cepet.
 *
 * ─── Session ───
 * {
 *   id: string; projectID: string; directory: string; parentID?: string
 *   title: string; version: string
 *   summary?: { additions, deletions, files, diffs? }
 *   share?: { url: string }
 *   time: { created, updated, compacting? }
 *   revert?: { messageID, partID?, snapshot?, diff? }
 * }
 *
 * ─── Message ───
 * UserMessage:   { id, sessionID, role: "user", agent, model, parts, ... }
 * AssistantMessage: { id, sessionID, role: "assistant", parentID, modelID,
 *   providerID, mode, cost, tokens: { input, output, reasoning, cache }, finish? }
 *
 * ─── Part Types ───
 * "text"       → { type, text, synthetic?, ignored? }
 * "reasoning"  → { type, text }
 * "file"       → { type, mime, url, source? }
 * "tool"       → { type, callID, tool, state: ToolState }
 * "subtask"    → { type, prompt, description, agent }
 * "agent"      → { type, name, source? }
 * "step-start" → { type, snapshot? }
 * "step-finish" → { type, reason, cost, tokens }
 * "snapshot"   → { type, snapshot }
 * "patch"      → { type, hash, files[] }
 * "retry"      → { type, attempt, error }
 * "compaction" → { type, auto }
 *
 * ─── ToolState ───
 * { status: "pending"|"running"|"completed"|"error", input, output?, error?, time }
 *
 * ─── Agent ───
 * { name, description?, mode, builtIn, permission, model?, prompt?, tools,
 *   options, maxSteps?, temperature?, topP?, color? }
 *
 * ─── Model ───
 * { id, providerID, name, api, capabilities, cost, limit, status, options, headers }
 *
 * ─── Permission ───
 * { id, type, pattern?, sessionID, messageID, callID?, title, metadata, time }
 *
 * ─── SessionStatus ───
 * { type: "idle" } | { type: "busy" } | { type: "retry"; attempt; message; next }
 *
 * ─── Project ───
 * { id, worktree, vcsDir?, vcs?, time }
 *
 * ─── Pty ───
 * { id, title, command, args, cwd, status: "running"|"exited", pid }
 *
 * ─── FileDiff ───
 * { file, before, after, additions, deletions }
 *
 * ─── Todo ───
 * { content, status, priority, id }
 *
 * ─── Path ───
 * { state, config, worktree, directory }
 *
 * ─── Error Types ───
 * ProviderAuthError     → { providerID, message }
 * UnknownError          → { message }
 * MessageOutputLengthError → {}
 * MessageAbortedError   → { message }
 * ApiError              → { message, statusCode?, isRetryable, responseHeaders?, responseBody? }
 * BadRequestError       → { message, kind? }
 * NotFoundError         → { message }
 */

// ===================================================================
//  RUNNER — Test semua method tambahan
// ===================================================================
export async function runSupplement(client: OpencodeClient) {
  console.log("=== Project ===")
  await projectList(client)
  await projectCurrent(client)

  console.log("\n=== Command ===")
  await commandList(client)

  console.log("\n=== Provider ===")
  await providerList(client)

  console.log("\n=== Tool ===")
  await toolIds(client)

  console.log("\n=== LSP / Formatter / MCP ===")
  await lspStatus(client)
  await formatterStatus(client)
  await mcpStatus(client)

  console.log("\n=== File ===")
  await fileList(client, ".")
}
