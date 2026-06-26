/**
 * ==========================================================
 *  Plugin Hooks Reference — OpenCode SDK
 * ==========================================================
 *
 * Semua hook yang bisa dipake dalam plugin opencode.
 * Lengkap dengan tipe input/output dan contoh implementasi.
 *
 * Sumber:
 *   - SDK-REFERENCE.md (Plugin Hooks Reference section)
 *   - https://opencode.ai/docs/plugins/
 *   - https://opencode.ai/docs/sdk/
 *
 * Struktur dasar plugin:
 *
 *   import type { Plugin } from "@opencode-ai/plugin"
 *
 *   export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
 *     return {
 *       // hooks here
 *     }
 *   }
 *
 * Context (parameter yg diterima plugin function):
 *   - project   — Project info (id, worktree, vcsDir, vcs, time)
 *   - client    — OpencodeClient (SDK client buat panggil API)
 *   - $         — Bun shell API (buat execute command)
 *   - directory — Current working directory
 *   - worktree  — Git worktree path
 *
 * ==========================================================
 *  DAFTAR HOOK
 * ==========================================================
 *
 *  [events]         event              — Generic event listener (catch all)
 *  [chat]           chat.message       — Inject/modify user message sblm diproses
 *                   chat.params        — Modify LLM parameters (temperature, topP, dll)
 *                   chat.headers       — Modify HTTP headers yg dikirim ke provider
 *  [permission]     permission.ask     — Auto-allow/deny permission request
 *  [command]        command.execute.before — Inject parts sblm slash-command jalan
 *  [tool]           tool               — Register custom AI-callable tool
 *                   tool.execute.before    — Modify tool arguments sblm execute
 *                   tool.execute.after     — Modify tool result setelah execute
 *                   tool.definition        — Override tool desc/params ke LLM
 *  [shell]          shell.env          — Inject env vars ke shell command
 *  [config]         config             — Validasi/transform resolved config
 *  [auth]           auth               — Register OAuth / API key method
 *  [provider]       provider           — Register custom LLM provider
 *  [compaction]     experimental.session.compacting       — Customize session compaction
 *                   experimental.compaction.autocontinue  — Skip auto-continue setelah compact
 *  [lifecycle]      dispose            — Cleanup saat plugin di-unload
 */

// ===================================================================
//  1. EVENT — Generic event listener
// ===================================================================
/**
 * Signature:
 *   event: async ({ event }: { event: Event }) => void
 *
 * Nangkep SEMUA event. Discriminate pake event.type.
 * Lengkap: "session.created", "session.idle", "message.updated", dll.
 *
 * Input:
 *   event: Event (discriminated union by `type`)
 *
 * Contoh:
 */
export const eventExample = {
  event: async ({ event }: { event: any }) => {
    // Cek type untuk discriminate
    if (event.type === "session.created") {
      // properties.info: Session
      console.log("Session baru:", event.properties.info.id)
    }

    if (event.type === "session.idle") {
      // properties.sessionID: string
      console.log(`Session ${event.properties.sessionID} selesai`)
    }

    if (event.type === "session.status") {
      // properties: { sessionID: string; status: SessionStatus }
      // SessionStatus: { type: "idle" } | { type: "busy" } | { type: "retry"; attempt: number; ... }
      console.log(`Status ${event.properties.sessionID}: ${event.properties.status.type}`)
    }

    if (event.type === "session.error") {
      // properties: { sessionID?: string; error?: ProviderAuthError | UnknownError | ... }
      console.error("Session error:", event.properties.error)
    }

    if (event.type === "session.diff") {
      // properties: { sessionID: string; diff: Array<FileDiff> }
      // FileDiff: { file: string; before: string; after: string; additions: number; deletions: number }
      console.log(`Diff computed: ${event.properties.diff.length} files`)
    }

    if (event.type === "session.compacted") {
      console.log(`Session ${event.properties.sessionID} compacted`)
    }

    if (event.type === "message.updated") {
      // properties.info: Message (UserMessage | AssistantMessage)
      const msg = event.properties.info
      console.log(`Message ${msg.id} updated, role=${msg.role}`)
    }

    if (event.type === "message.removed") {
      // properties: { sessionID: string; messageID: string }
      console.log(`Message ${event.properties.messageID} removed`)
    }

    if (event.type === "message.part.updated") {
      // properties: { part: Part; delta?: string }
      // delta = streaming text chunk
      console.log("Part streaming:", event.properties.delta)
    }

    if (event.type === "message.part.removed") {
      // properties: { sessionID: string; messageID: string; partID: string }
      console.log(`Part ${event.properties.partID} removed`)
    }

    if (event.type === "file.edited") {
      // properties: { file: string }
      console.log(`File edited: ${event.properties.file}`)
    }

    if (event.type === "file.watcher.updated") {
      // properties: { file: string; event: "add" | "change" | "unlink" }
      console.log(`File watcher: ${event.properties.file} — ${event.properties.event}`)
    }

    if (event.type === "todo.updated") {
      // properties: { sessionID: string; todos: Array<Todo> }
      // Todo: { content: string; status: string; priority: string; id: string }
      console.log(`Todo updated: ${event.properties.todos.length} items`)
    }

    if (event.type === "command.executed") {
      // properties: { name: string; sessionID: string; arguments: string; messageID: string }
      console.log(`Command /${event.properties.name} dijalankan`)
    }

    if (event.type === "permission.updated") {
      // properties: Permission
      // Permission: { id: string; type: string; pattern?: string | string[]; ... }
      console.log("Permission prompt muncul")
    }

    if (event.type === "permission.replied") {
      // properties: { sessionID: string; permissionID: string; response: string }
      console.log(`Permission ${event.properties.permissionID}: ${event.properties.response}`)
    }

    if (event.type === "lsp.client.diagnostics") {
      // properties: { serverID: string; path: string }
      console.log(`LSP diagnostics: ${event.properties.serverID} — ${event.properties.path}`)
    }

    if (event.type === "lsp.updated") {
      console.log("LSP state changed")
    }

    if (event.type === "tui.prompt.append") {
      // properties: { text: string }
      console.log("TUI prompt diubah")
    }

    if (event.type === "tui.command.execute") {
      // properties: { command: string }
      console.log(`TUI command: ${event.properties.command}`)
    }

    if (event.type === "tui.toast.show") {
      // properties: { title?: string; message: string; variant: "info"|"success"|"warning"|"error"; duration?: number }
      console.log(`Toast [${event.properties.variant}]: ${event.properties.message}`)
    }

    if (event.type === "pty.created" || event.type === "pty.updated") {
      // properties.info: Pty
      // Pty: { id: string; title: string; command: string; args: string[]; cwd: string; status: "running"|"exited"; pid: number }
      console.log(`PTY ${event.type}: ${event.properties.info?.id}`)
    }

    if (event.type === "pty.exited") {
      // properties: { id: string; exitCode: number }
      console.log(`PTY ${event.properties.id} exited (code ${event.properties.exitCode})`)
    }

    if (event.type === "pty.deleted") {
      console.log(`PTY ${event.properties.id} deleted`)
    }

    if (event.type === "installation.updated") {
      // properties: { version: string }
      console.log(`OpenCode updated to ${event.properties.version}`)
    }

    if (event.type === "installation.update-available") {
      console.log(`Update available: ${event.properties.version}`)
    }

    if (event.type === "server.connected") {
      console.log("Server connected")
    }

    if (event.type === "server.instance.disposed") {
      // properties: { directory: string }
      console.log("Server instance disposed")
    }

    if (event.type === "vcs.branch.updated") {
      // properties: { branch?: string }
      console.log(`Branch: ${event.properties.branch}`)
    }
  },
}

// ===================================================================
//  2. CHAT.MESSAGE — Inject/modify user message sebelum diproses AI
// ===================================================================
/**
 * Signature:
 *   "chat.message": async (input, output) => void
 *
 * Input:
 *   { sessionID, agent?, model?, messageID?, variant? }
 *
 * Output (mutable):
 *   { message: UserMessage; parts: Part[] }
 *
 * Part types:
 *   - { type: "text", text: string, synthetic?: boolean, ignored?: boolean }
 *   - { type: "reasoning", text: string }
 *   - { type: "file", mime: string, url: string, source?: string }
 *   - { type: "tool", callID: string, tool: string, state: ToolState }
 *   - { type: "step-start", snapshot?: string }
 *   - { type: "step-finish", reason: string, cost: number, tokens: object }
 *   - { type: "snapshot", snapshot: string }
 *   - { type: "patch", hash: string, files: string[] }
 *   - { type: "agent", name: string, source?: string }
 *   - { type: "retry", attempt: number, error: string }
 *   - { type: "compaction", auto: boolean }
 *   - { type: "subtask", prompt: string, description: string, agent: string }
 *
 * ToolState (untuk `tool` part):
 *   { status: "pending"|"running"|"completed"|"error", input: {}, raw?: string, output?: string, ... }
 *
 * Contoh:
 */
export const chatMessageExample = {
  "chat.message": async (input: any, output: any) => {
    // Tambah teks ke user message
    output.parts.push({ type: "text", text: " [auto-logged]" })

    // Inject file biar AI bisa bacanya
    output.parts.push({
      type: "file",
      mime: "text/markdown",
      url: "file:///home/user/notes.md",
    })

    // Inject reasoning (chain-of-thought)
    output.parts.push({
      type: "reasoning",
      text: "User asked about something, I'll help them...",
    })

    // Ganti agent
    output.message.agent = "build"

    // Tandai message sebagai system prompt
    // (pake synthetic biar gak dihitung sebagai user input)
    output.parts = output.parts.map((p: any) =>
      p.type === "text" ? { ...p, synthetic: true } : p
    )
  },
}

// ===================================================================
//  3. CHAT.PARAMS — Modify LLM parameters
// ===================================================================
/**
 * Signature:
 *   "chat.params": async (input, output) => void
 *
 * Input:
 *   { sessionID, agent, model, provider, message }
 *
 * Output (mutable):
 *   { temperature, topP, topK, maxOutputTokens, options }
 *
 * Contoh:
 */
export const chatParamsExample = {
  "chat.params": async (input: any, output: any) => {
    // Atur temperature (0 = deterministic, 2 = kreatif)
    output.temperature = 0.3

    // Batasi output token
    output.maxOutputTokens = 4096

    // Top-P sampling
    output.topP = 0.9

    // Top-K sampling (kalo provider support)
    output.topK = 40

    // Options tambahan (provider-specific)
    output.options = {
      ...output.options,
      stop: ["\n\n"],
    }
  },
}

// ===================================================================
//  4. CHAT.HEADERS — Modify HTTP headers ke LLM provider
// ===================================================================
/**
 * Signature:
 *   "chat.headers": async (input, output) => void
 *
 * Input:
 *   { sessionID, agent, model, provider, message }
 *
 * Output (mutable):
 *   { headers: Record<string, string> }
 *
 * Contoh:
 */
export const chatHeadersExample = {
  "chat.headers": async (input: any, output: any) => {
    // Inject custom header (misal buat proxy/tracing)
    output.headers["X-Custom-Trace"] = `session-${input.sessionID}`
    output.headers["X-Agent"] = input.agent
  },
}

// ===================================================================
//  5. PERMISSION.ASK — Auto-allow / auto-deny permission
// ===================================================================
/**
 * Signature:
 *   "permission.ask": async (input, output) => void
 *
 * Input:
 *   Permission = {
 *     id: string
 *     type: string          // "read" | "edit" | "bash" | "webfetch" | dll
 *     pattern?: string | string[]
 *     sessionID: string
 *     messageID: string
 *     callID?: string
 *     title: string
 *     metadata: {}
 *     time: { created: number }
 *   }
 *
 * Output (mutable):
 *   { status: "ask" | "deny" | "allow" }
 *
 *   - "ask"  → tanya user (default)
 *   - "allow" → auto-izin
 *   - "deny" → auto-tolak
 *
 * Contoh:
 */
export const permissionAskExample = {
  "permission.ask": async (input: any, output: any) => {
    // Auto-allow semua read
    if (input.type === "read") {
      output.status = "allow"
    }

    // Tolak akses ke .env
    if (input.type === "read" && input.pattern?.includes(".env")) {
      output.status = "deny"
    }

    // Izinin bash kalo command-nya aman
    if (input.type === "bash" && input.pattern === "npm test") {
      output.status = "allow"
    }

    // Sisanya: tanya user (default)
  },
}

// ===================================================================
//  6. COMMAND.EXECUTE.BEFORE — Inject parts sebelum slash-command
// ===================================================================
/**
 * Signature:
 *   "command.execute.before": async (input, output) => void
 *
 * Input:
 *   { command: string, sessionID: string, arguments: string }
 *
 * Output (mutable):
 *   { parts: Part[] }
 *
 * Contoh:
 */
export const commandExecuteBeforeExample = {
  "command.execute.before": async (input: any, output: any) => {
    // Inject system context sebelum command jalan
    if (input.command === "explain") {
      output.parts.push({
        type: "text",
        text: `[Context: user meminta explain tentang: ${input.arguments}]`,
        synthetic: true,
      })
    }

    if (input.command === "test") {
      output.parts.push({
        type: "text",
        text: "Jalankan test dengan coverage report.",
        synthetic: true,
      })
    }
  },
}

// ===================================================================
//  7. TOOL — Register custom AI-callable tools
// ===================================================================
/**
 * Signature:
 *   tool: {
 *     [key: string]: ToolDefinition
 *   }
 *
 * Tool definition via `tool()` helper:
 *
 *   import { tool, type Plugin } from "@opencode-ai/plugin"
 *
 *   tool({
 *     description: "Apa yg tool ini lakukan",
 *     args: {
 *       param1: tool.schema.string().describe("Penjelasan parameter"),
 *       param2: tool.schema.number().describe("..."),
 *     },
 *     async execute(args, context) {
 *       // context: { sessionID, messageID, agent, directory, worktree, abort, metadata(), ask() }
 *       metadata({ title: "Result title" })
 *       return "Output string"
 *       // atau: return { title?, output: string, metadata?, attachments?: FilePart[] }
 *     },
 *   })
 *
 * Contoh:
 */
import { tool } from "@opencode-ai/plugin"

export const customToolExample = {
  tool: {
    // Tool sederhana — return string
    get_time: tool({
      description: "Dapatkan waktu saat ini di timezone tertentu",
      args: {
        timezone: tool.schema
          .string()
          .describe("IANA timezone, misal 'Asia/Jakarta' atau 'UTC'")
          .default("UTC"),
      },
      async execute(args, context) {
        const now = new Date()
        const tz = args.timezone || "UTC"
        const time = now.toLocaleString("id-ID", { timeZone: tz })
        context.metadata({ title: `Waktu ${tz}` })
        return `Waktu di ${tz}: ${time}`
      },
    }),

    // Tool kompleks — return object
    search_docs: tool({
      description: "Cari dokumentasi opencode berdasarkan keyword",
      args: {
        query: tool.schema.string().describe("Keyword pencarian"),
        limit: tool.schema.number().describe("Maks hasil (1-20)").default(5),
      },
      async execute(args, context) {
        const { directory, worktree } = context

        context.metadata({ title: "Hasil Pencarian" })

        return {
          title: `Dokumentasi untuk "${args.query}"`,
          output: `Menemukan ${args.limit} hasil di ${directory}`,
          metadata: { keyword: args.query, source: worktree },
          attachments: [
            { type: "file", mime: "text/plain", url: `file://${worktree}/README.md` },
          ],
        }
      },
    }),
  },
}

// ===================================================================
//  8. TOOL.EXECUTE.BEFORE — Modify tool arguments sebelum execute
// ===================================================================
/**
 * Signature:
 *   "tool.execute.before": async (input, output) => void
 *
 * Input:
 *   { tool: string, sessionID: string, callID: string }
 *
 * Output (mutable):
 *   { args: any }
 *
 * Contoh:
 */
export const toolExecuteBeforeExample = {
  "tool.execute.before": async (input: any, output: any) => {
    // Proteksi: bersihin path traversal
    if (input.tool === "read" && output.args.filePath) {
      output.args.filePath = output.args.filePath.replace(/\.\.\//g, "")
    }

    // Proteksi: blokir baca .env
    if (input.tool === "read" && output.args.filePath?.includes(".env")) {
      throw new Error("Dilarang membaca file .env!")
    }

    // Batasi argumen bash
    if (input.tool === "bash" && output.args.command) {
      if (output.args.command.includes("rm -rf /")) {
        throw new Error("Command berbahaya!")
      }
    }

    // Inject default argument
    if (input.tool === "find.files") {
      output.args.limit = Math.min(output.args.limit || 50, 200)
    }
  },
}

// ===================================================================
//  9. TOOL.EXECUTE.AFTER — Modify tool result setelah execute
// ===================================================================
/**
 * Signature:
 *   "tool.execute.after": async (input, output) => void
 *
 * Input:
 *   { tool: string, sessionID: string, callID: string, args: any }
 *
 * Output (mutable):
 *   { title: string, output: string, metadata: any }
 *
 * Contoh:
 */
export const toolExecuteAfterExample = {
  "tool.execute.after": async (input: any, output: any) => {
    // Tambah metadata
    output.metadata = {
      ...output.metadata,
      processed_by: "security-plugin",
      timestamp: Date.now(),
    }

    // Filter output sensitif
    if (input.tool === "bash") {
      // Mask API keys di output
      output.output = output.output.replace(
        /(sk-[a-zA-Z0-9]+)/g,
        "sk-***REDACTED***"
      )
    }

    // Kasih title kalo gak ada
    if (!output.title) {
      output.title = `Hasil dari ${input.tool}`
    }
  },
}

// ===================================================================
//  10. TOOL.DEFINITION — Override tool desc/params ke LLM
// ===================================================================
/**
 * Signature:
 *   "tool.definition": async (input, output) => void
 *
 * Input:
 *   { toolID: string }
 *
 * Output (mutable):
 *   { description: string; parameters: any }
 *
 * Contoh:
 */
export const toolDefinitionExample = {
  "tool.definition": async (input: any, output: any) => {
    // Ganti description tool yg dikirim ke LLM
    if (input.toolID === "bash") {
      output.description = "Execute shell command. Berhati-hatilah!"
      output.parameters = {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "Shell command. JANGAN gunakan rm -rf!",
          },
        },
        required: ["command"],
      }
    }

    // Sembunyikan tool tertentu dari LLM
    if (input.toolID === "internal_debug_tool") {
      output.description = ""  // empty = tool gak dikirim ke LLM
    }
  },
}

// ===================================================================
//  11. SHELL.ENV — Inject env vars ke shell command
// ===================================================================
/**
 * Signature:
 *   "shell.env": async (input, output) => void
 *
 * Input:
 *   { cwd: string, sessionID?: string, callID?: string }
 *
 * Output (mutable):
 *   { env: Record<string, string> }
 *
 * Hook ini ngaruh ke SEMUA shell execution:
 *   - AI tool calls (Bash tool)
 *   - User terminal sessions
 *
 * Contoh:
 */
export const shellEnvExample = {
  "shell.env": async (input: any, output: any) => {
    // Inject env vars statis
    output.env.MY_API_KEY = "secret-value"
    output.env.DEBUG = "true"
    output.env.NODE_ENV = "development"

    // Inject project-specific
    output.env.PROJECT_ROOT = input.cwd
    output.env.CACHE_DIR = `${input.cwd}/.cache`

    // Conditional berdasarkan directory
    if (input.cwd?.includes("frontend")) {
      output.env.VITE_API_URL = "http://localhost:3000"
    }
  },
}

// ===================================================================
//  12. CONFIG — Validasi / transform config
// ===================================================================
/**
 * Signature:
 *   config: async (config: Config) => void
 *
 * Dipanggil dengan resolved config project.
 * Bisa dipake buat validasi atau transform.
 *
 * Config shape:
 *   { model, theme, agent, permission, logLevel, ... }
 *
 * Contoh:
 */
export const configExample = {
  config: async (config: any) => {
    // Validasi: pastikan model di-set
    if (!config.model) {
      console.warn("Config: model belum di-set!")
    }

    // Force permission
    if (config.permission) {
      config.permission.edit = "allow"
    }

    // Log config yg dipake
    console.log("Config loaded:", JSON.stringify(config, null, 2))
  },
}

// ===================================================================
//  13. AUTH — Register authentication method
// ===================================================================
/**
 * Signature:
 *   auth: {
 *     provider: string
 *     loader?: (auth: () => Promise<Auth>, provider: Provider) => Promise<Record<string, any>>
 *     methods: Array<AuthMethod>
 *   }
 *
 * Auth types:
 *   { type: "oauth"; refresh: string; access: string; expires: number; enterpriseUrl?: string }
 *   | { type: "api"; key: string; metadata?: {} }
 *   | { type: "wellknown"; key: string; token: string }
 *
 * Contoh:
 */
export const authExample = {
  auth: {
    provider: "my-custom-provider",
    methods: [
      {
        type: "oauth" as const,
        name: "OAuth",
        description: "Login dengan Google",
        url: "https://accounts.google.com/o/oauth2/auth",
      },
      {
        type: "api" as const,
        name: "API Key",
        description: "Masukkan API key",
      },
    ],
    async loader(auth: any, provider: any) {
      const credentials = await auth()
      return { headers: { Authorization: `Bearer ${credentials.access}` } }
    },
  },
}

// ===================================================================
//  14. PROVIDER — Register custom LLM provider
// ===================================================================
/**
 * Signature:
 *   provider: {
 *     id: string
 *     models?: (provider: ProviderV2, ctx: ProviderHookContext) => Promise<Record<string, ModelV2>>
 *   }
 *
 * Contoh:
 */
export const providerExample = {
  provider: {
    id: "my-provider",
    async models(provider: any, ctx: any) {
      // Dynamic model listing
      return {
        "my-model-v1": {
          id: "my-model-v1",
          providerID: "my-provider",
          name: "My Model V1",
          api: { id: "my-provider", url: "https://api.example.com/v1", npm: "@example/sdk" },
          capabilities: {
            temperature: true,
            reasoning: false,
            attachment: true,
            toolcall: true,
            input: { text: true, audio: false, image: true, video: false, pdf: true },
            output: { text: true, audio: false, image: false, video: false, pdf: false },
          },
          cost: { input: 1, output: 3, cache: { read: 0.1, write: 1.5 } },
          limit: { context: 128000, output: 4096 },
          status: "active" as const,
          options: {},
          headers: {},
        },
      }
    },
  },
}

// ===================================================================
//  15. EXPERIMENTAL.SESSION.COMPACTING — Customize compaction
// ===================================================================
/**
 * Signature:
 *   "experimental.session.compacting": async (input, output) => void
 *
 * Input:
 *   { sessionID: string }
 *
 * Output (mutable):
 *   { context: string[]; prompt?: string }
 *
 * - `context` → array string yg ditambahkan ke default prompt
 * - `prompt`  → kalo di-set, REPLACE total default prompt (context diabaikan)
 *
 * Contoh:
 */
export const compactingExample = {
  "experimental.session.compacting": async (input: any, output: any) => {
    // Inject additional context
    output.context.push(`## Custom Context
Apa yg perlu diingat setelah compaction:
- Task saat ini: Refactor auth module
- File yg diubah: src/auth/*.ts
- Decision: Pake JWT instead of session
`)

    // Bisa juga replace total compaction prompt:
    // output.prompt = "Buat ringkasan session yang fokus pada ..."
  },
}

// ===================================================================
//  16. EXPERIMENTAL.COMPACTION.AUTOCONTINUE — Skip auto-continue
// ===================================================================
/**
 * Signature:
 *   "experimental.compaction.autocontinue": async (input, output) => void
 *
 * Input:
 *   { sessionID, agent, model, provider, message, overflow }
 *
 * Output (mutable):
 *   { enabled: boolean }
 *
 * Contoh:
 */
export const compactionAutoContinueExample = {
  "experimental.compaction.autocontinue": async (input: any, output: any) => {
    // Matiin auto-continue setelah compaction
    output.enabled = false

    // Atau aktifkan hanya untuk agent tertentu
    if (input.agent === "build") {
      output.enabled = true
    }
  },
}

// ===================================================================
//  17. DISPOSE — Cleanup plugin
// ===================================================================
/**
 * Signature:
 *   dispose: () => Promise<void>
 *
 * Dipanggil pas plugin di-unload (server shutdown / reload).
 * Gunakan buat:
 *   - Close koneksi database / websocket
 *   - Bersihin interval / timeout
 *   - Hapus file temporary
 *   - Unsubscribe dari event eksternal
 *
 * Contoh:
 */
export const disposeExample = {
  dispose: async () => {
    console.log("Plugin dibersihkan")
    // cleanup: close connections, clear timers, dll
  },
}

// ===================================================================
//  FULL EXAMPLE: Plugin lengkap dengan semua hook
// ===================================================================
//
//  export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
//    const startTime = Date.now()
//    const connections = new Map<string, any>()
//
//    return {
//      // ── Lifecycle ──
//      dispose: async () => {
//        for (const conn of connections.values()) conn.close()
//        connections.clear()
//      },
//
//      // ── Events ──
//      event: async ({ event }) => {
//        if (event.type === "session.created") {
//          await client.app.log({
//            body: { service: "my-plugin", level: "info", message: `Session ${event.properties.info.id}` },
//          })
//        }
//      },
//
//      // ── Chat hooks ──
//      "chat.message": async (input, output) => {
//        output.parts.push({ type: "text", text: " [tracked]" })
//      },
//
//      "chat.params": async (input, output) => {
//        output.temperature = 0.5
//      },
//
//      // ── Permission ──
//      "permission.ask": async (input, output) => {
//        if (input.type === "read") output.status = "allow"
//      },
//
//      // ── Tools ──
//      tool: {
//        my_custom_tool: tool({
//          description: "Custom tool example",
//          args: { input: tool.schema.string() },
//          async execute(args, ctx) {
//            return `Hello ${args.input} dari ${ctx.directory}`
//          },
//        }),
//      },
//
//      "tool.execute.before": async (input, output) => {
//        if (input.tool === "bash" && output.args.command?.includes("rm -rf")) {
//          throw new Error("Dilarang!")
//        }
//      },
//
//      "tool.execute.after": async (input, output) => {
//        output.metadata = { ...output.metadata, plugin: "my-plugin" }
//      },
//
//      // ── Shell ──
//      "shell.env": async (input, output) => {
//        output.env.CUSTOM_VAR = "value"
//      },
//
//      // ── Config ──
//      config: async (config) => {
//        console.log("Config resolved")
//      },
//    }
//  }
