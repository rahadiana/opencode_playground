/**
 * ==========================================================
 *  Dynamic Agent Management — OpenCode
 * ==========================================================
 *
 * Cara bikin, daftarin, dan pake agent secara dinamis.
 *
 * Ada 3 cara bikin agent:
 *   A. Config JSON  → agent definitions di opencode.json
 *   B. Markdown     → file .md di .opencode/agents/ atau ~/.config/opencode/agents/
 *   C. Programmatic → write file markhead + config.update() via plugin
 *
 * Built-in agents yg selalu ada:
 *   Primary: build, plan
 *   Subagent: general, explore, scout
 *   System (hidden): compaction, title, summary
 *
 * Sumber:
 *   - https://opencode.ai/docs/agents/
 *   - SDK-REFERENCE.md
 */

import { tool } from "@opencode-ai/plugin"
import type { OpencodeClient } from "@opencode-ai/sdk"

// ===================================================================
//  1. BIKIN AGENT VIA config.update() — Runtime
// ===================================================================
/**
 * Signature:
 *   client.config.update({ body: { agent: { ... } } })
 *
 * Bisa nambahin / update agent definition di runtime.
 *
 * Agent config shape (dari Agent type):
 *   {
 *     name?: string             // identifier, misal "code-reviewer"
 *     description?: string      // muncul di @ mention
 *     mode: "primary" | "subagent" | "all"
 *     model?: { modelID: string; providerID: string }
 *     prompt?: string           // system prompt
 *     temperature?: number      // 0.0 - 1.0
 *     topP?: number             // 0.0 - 1.0
 *     maxSteps?: number         // max iterations
 *     color?: string            // hex color atau theme color
 *     hidden?: boolean          // sembunyi dari @ menu
 *     disable?: boolean         // nonaktifkan
 *     permission?: {
 *       read?: "allow" | "ask" | "deny"
 *       edit?: "allow" | "ask" | "deny"
 *       bash?: "allow" | "ask" | "deny" | Record<string, string>
 *       glob?: "allow" | "ask" | "deny"
 *       grep?: "allow" | "ask" | "deny"
 *       webfetch?: "allow" | "ask" | "deny"
 *       task?: "allow" | "ask" | "deny" | Record<string, string>
 *       ...
 *     }
 *   }
 *
 * Contoh:
 */
export async function registerAgentRuntime(client: OpencodeClient) {
  await client.config.update({
    body: {
      agent: {
        "code-reviewer": {
          description: "Review code untuk best practices dan security",
          mode: "subagent",
          permission: {
            read: "allow",
            edit: "deny",
            bash: "deny",
          },
        },
      },
    },
  } as any)
  console.log("Agent 'code-reviewer' registered via config.update()")
}

// ===================================================================
//  2. BIKIN AGENT LEWAT FILE MARKDOWN
// ===================================================================
/**
 * Markdown agent file format:
 *
 *   ---
 *   description: Apa yg agent ini lakuin
 *   mode: subagent | primary | all
 *   model: provider/model-id (optional)
 *   temperature: 0.1 (optional)
 *   topP: 0.9 (optional)
 *   color: "#ff6b6b" | "accent" (optional)
 *   hidden: true (optional)
 *   disable: true (optional)
 *   permission:
 *     read: allow
 *     edit: deny
 *     bash: deny
 *     webfetch: deny
 *   ---
 *   System prompt untuk agent ini...
 *
 * Lokasi:
 *   - Project:  .opencode/agents/<name>.md
 *   - Global:   ~/.config/opencode/agents/<name>.md
 *
 * Nama file (tanpa .md) jadi agent identifier.
 *
 * Contoh:
 */
export const agentMarkdownExamples = [
  {
    file: ".opencode/agents/docs-writer.md",
    content: `---
description: Menulis dan maintain dokumentasi project
mode: subagent
permission:
  read: allow
  edit: allow
  bash: deny
  webfetch: allow
---
Kamu adalah technical writer. Buat dokumentasi yang jelas dan komprehensif.
Fokus pada:
- Penjelasan yang mudah dipahami
- Struktur yang rapi
- Code examples
- Bahasa yang user-friendly
`,
  },
  {
    file: ".opencode/agents/security-auditor.md",
    content: `---
description: Audit keamanan dan identifikasi vulnerabilities
mode: subagent
permission:
  read: allow
  edit: deny
  webfetch: allow
---
Kamu adalah security expert. Fokus identifikasi potensi masalah keamanan:
- Input validation vulnerabilities
- Authentication & authorization flaws
- Data exposure risks
- Dependency vulnerabilities
- Configuration security issues
`,
  },
  {
    file: ".opencode/agents/testing-agent.md",
    content: `---
description: Nulis dan maintain test
mode: subagent
model: anthropic/claude-sonnet-4-20250514
temperature: 0.2
permission:
  read: allow
  edit: allow
  bash: allow
---
Kamu adalah software tester. Buat test yang komprehensif.
Fokus pada:
- Unit test untuk business logic
- Integration test untuk API
- Edge cases dan error handling
- Test coverage yang tinggi
Jalankan test setelah selesai nulis.
`,
  },
]

// ===================================================================
//  3. WRITE AGENT FILE PROGRAMMATICALLY — Via plugin
// ===================================================================
/**
 * Plugin tool buat create agent file on-the-fly.
 * File ditempatin di .opencode/agents/ biar langsung terbaca.
 *
 * Note: File agent cuma dibaca pas startup.
 * Kalo pengen langsung aktif, perlu restart atau pake
 * cara lain (config.update + prompt dengan agent tsb).
 */
export const createAgentTool = {
  tool: {
    create_agent: tool({
      description: "Buat agent kustom baru. Nama file jadi identifier agent.",
      args: {
        name: tool.schema.string().describe("Nama agent (identifier, lowercase, tanpa spasi)"),
        description: tool.schema.string().describe("Deskripsi singkat agent"),
        mode: tool.schema.string().describe("'subagent', 'primary', atau 'all'").default("subagent"),
        prompt: tool.schema.string().describe("System prompt untuk agent ini"),
        allowEdit: tool.schema.boolean().describe("Izin edit file").default(false),
        allowBash: tool.schema.boolean().describe("Izin bash command").default(false),
      },
      async execute(args: any, ctx: any) {
        const { name, description, mode, prompt, allowEdit, allowBash } = args
        const { worktree } = ctx

        const editPerm = allowEdit ? "allow" : "deny"
        const bashPerm = allowBash ? "allow" : "deny"

        const content = `---
description: ${description}
mode: ${mode}
permission:
  read: allow
  edit: ${editPerm}
  bash: ${bashPerm}
---

${prompt}
`

        const filePath = `${worktree}/.opencode/agents/${name}.md`

        // Note: di plugin real, pake client.file.write atau bash untuk nulis file
        console.log(`Agent file created: ${filePath}`)
        console.log("Restart opencode atau pake config.update biar langsung aktif.")

        return {
          title: `Agent ${name} Created`,
          output: content,
          metadata: { filePath, name, mode },
        }
      },
    }),
  },
}

// ===================================================================
//  4. REGISTER AGENT VIA PLUGIN — + prompt langsung pake agent itu
// ===================================================================
/**
 * Cara lengkap: register agent via config.update() + inject subtask
 * biar AI langsung pake agent barunya.
 *
 * Plugin hook example:
 */
export const dynamicAgentPluginExample = {
  // Register agent pas config diload
  config: async (config: any) => {
    // Pastiin agent kustom ada di config
    if (!config.agent) config.agent = {}

    // Auto-register agent kalo belum ada
    if (!config.agent["code-analyzer"]) {
      config.agent["code-analyzer"] = {
        description: "Menganalisa code quality dan complexity",
        mode: "subagent",
        permission: { read: "allow", edit: "deny", bash: "deny" },
      }
    }
  },

  // Inject subtask dengan agent tertentu
  "chat.message": async (input: any, output: any) => {
    // Kalo user minta code review, delegate ke agent kustom
    const userText = output.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join(" ")

    if (userText.toLowerCase().includes("review") || userText.toLowerCase().includes("audit")) {
      // Inject subtask: suruh security-auditor dulu
      output.parts.push({
        type: "subtask",
        prompt: "Lakukan security audit pada code yang diminta user",
        description: "Security audit phase",
        agent: "security-auditor",
      })

      // Inject subtask: baru code-review
      output.parts.push({
        type: "subtask",
        prompt: "Review code quality setelah security audit",
        description: "Code review phase",
        agent: "code-reviewer",
      })
    }
  },

  // Track agent usage
  event: async ({ event }: { event: any }) => {
    if (event.type === "message.part.updated") {
      const part = event.properties.part
      if (part?.type === "agent") {
        console.log(`[Agent Switch] ${part.name}`)
      }
      if (part?.type === "subtask") {
        console.log(`[Subtask] ${part.description} → agent: ${part.agent}`)
      }
    }
  },
}

// ===================================================================
//  5. CLI — opencode agent create
// ===================================================================
/**
 * Bisa juga pake CLI:
 *   opencode agent create
 *
 * Ini interactive command yg bakal:
 *   1. Tanya lokasi penyimpanan (global / project)
 *   2. Minta deskripsi agent
 *   3. Generate system prompt otomatis
 *   4. Tanya permission yg diizinin
 *   5. Bikin markdown file
 *
 * Atau bikin manual lewat file:
 *   .opencode/agents/<name>.md
 *   ~/.config/opencode/agents/<name>.md
 */

// ===================================================================
//  6. LIST + SWITCH AGENT VIA SDK
// ===================================================================
/**
 * List agent yg terdaftar:
 */
export async function listAllAgents(client: OpencodeClient) {
  const raw = await client.app.agents() as any
  const agents = raw.data ?? []

  const primary = agents.filter((a: any) => a.mode === "primary" && !a.builtIn)
  const subagent = agents.filter((a: any) => a.mode === "subagent" && !a.builtIn)
  const builtin = agents.filter((a: any) => a.builtIn)

  console.log("=== Built-in Agents ===")
  for (const a of builtin) console.log(`  ${a.mode === "primary" ? "🔵" : "🟣"} ${a.name}: ${a.description ?? "-"}`)

  if (primary.length) {
    console.log("\n=== Custom Primary Agents ===")
    for (const a of primary) console.log(`  🔵 ${a.name}: ${a.description}`)
  }

  if (subagent.length) {
    console.log("\n=== Custom Subagents ===")
    for (const a of subagent) console.log(`  🟣 ${a.name}: ${a.description}`)
  }
}

/**
 * Switch agent via session.prompt():
 *   session.prompt({ body: { agent: "code-reviewer", ... } })
 *
 * Atau inject AgentPart:
 *   { type: "agent", name: "security-auditor", source: "plugin" }
 */
export async function promptWithCustomAgent(
  client: OpencodeClient,
  sessionId: string,
  agentName: string = "code-reviewer",
) {
  const r = await client.session.prompt({
    path: { id: sessionId },
    body: {
      parts: [{ type: "text" as const, text: "Kerjain task ini" }],
      agent: agentName,
    },
  })
  console.log(`Prompt dikirim ke agent: ${agentName}`)
  return r
}

// ===================================================================
//  7. FULL EXAMPLE — Dynamic Agent Manager Plugin
// ===================================================================
//
//  export const DynamicAgentManager: Plugin = async ({ client, $, worktree }) => {
//    return {
//      // Auto-register agent di startup via config hook
//      config: async (config) => {
//        if (!config.agent) config.agent = {}
//
//        // Pastiin agent kustom selalu ada
//        const defaultAgents = {
//          "code-reviewer": {
//            description: "Review code untuk best practices",
//            mode: "subagent",
//            permission: { read: "allow", edit: "deny" },
//          },
//          "db-expert": {
//            description: "Spesialis database dan query optimization",
//            mode: "subagent",
//            permission: { read: "allow", edit: "allow", bash: "ask" },
//          },
//        }
//
//        for (const [name, def] of Object.entries(defaultAgents)) {
//          if (!config.agent[name]) {
//            config.agent[name] = def
//          }
//        }
//      },
//
//      // Register tool buat bikin agent dinamis
//      tool: {
//        create_agent: tool({
//          description: "Buat agent kustom baru secara dinamis",
//          args: {
//            name: tool.schema.string(),
//            description: tool.schema.string(),
//            mode: tool.schema.string().default("subagent"),
//            prompt: tool.schema.string(),
//          },
//          async execute(args) {
//            const filePath = `${worktree}/.opencode/agents/${args.name}.md`
//            const content = `---\ndescription: ${args.description}\nmode: ${args.mode}\n---\n\n${args.prompt}`
//            await $`cat > ${filePath} << 'EOF'\n${content}\nEOF`
//            return `Agent ${args.name} created at ${filePath}. Restart to use it.`
//          },
//        }),
//
//        list_agents: tool({
//          description: "List semua agent yg tersedia (built-in + kustom)",
//          args: {},
//          async execute(_args, ctx) {
//            const agents = await ctx.client.app.agents()
//            const list = (agents.data ?? []).map((a: any) => `- ${a.name} (${a.mode}): ${a.description ?? "-"}`)
//            return list.join("\n") || "No agents found"
//          },
//        }),
//      },
//    }
//  }

// ===================================================================
//  RINGKASAN: Cara Bikin Agent Dinamis
// ===================================================================
//
//  ┌──────────────────────────────────────────────────────────────────┐
//  │  Method                    │  Kapan Aktif    │  Via             │
//  ├──────────────────────────────────────────────────────────────────┤
//  │  A. opencode.json config   │  Startup         │  Config file     │
//  │  B. .opencode/agents/*.md  │  Startup         │  Markdown file   │
//  │  C. config.update()        │  Runtime         │  SDK / Plugin    │
//  │  D. Plugin `config` hook   │  Startup         │  Plugin hook     │
//  │  E. opencode agent create  │  Interactive CLI │  Terminal        │
//  └──────────────────────────────────────────────────────────────────┘
//
//  Cara pake agent:
//    session.prompt({ body: { agent: "nama-agent" } })
//    @mention di chat: @code-reviewer tolong review ini
//    SubtaskPart: { type: "subtask", agent: "nama-agent", ... }
//    AgentPart:   { type: "agent", name: "nama-agent" }
