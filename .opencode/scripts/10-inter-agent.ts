/**
 * ==========================================================
 *  Inter-Agent Communication — OpenCode
 * ==========================================================
 *
 * Cara agent-agent berkomunikasi dan berkoordinasi di opencode.
 *
 * Mekanisme:
 *   A. Task Tool       → primary agent invoke subagent (child session)
 *   B. Subtask Part    → delegate task ke agent tertentu dalam 1 session
 *   C. Agent Part      → switch agent aktif di tengah session
 *   D. Child Sessions  → parent-child session tree
 *   E. Fork Session    → branch session buat eksperimen
 *   F. Message Passing → kirim pesan antar agent via inbox + session inject
 *   G. Event System    → broadcast event buat koordinasi
 *   H. Permission Task → kontrol subagent mana yg bisa di-invoke
 *
 * Sumber:
 *   - https://opencode.ai/docs/agents/
 *   - https://opencode.ai/docs/plugins/
 *   - SDK-REFERENCE.md
 *   - https://dev.to/gc-victor/agent-orchestration-in-opencode-3n4k
 *   - https://dev.to/uenyioha/porting-claude-codes-agent-teams-to-opencode-4hol
 */

import { tool } from "@opencode-ai/plugin"
import type { OpencodeClient } from "@opencode-ai/sdk"

// ===================================================================
//  1. TASK TOOL — Primary → Subagent delegation
// ===================================================================
/**
 * Ini mekanisme UTAMA interaksi antar agent di opencode.
 *
 * Cara kerja:
 *   1. Primary agent (build/plan) panggil `task` tool
 *   2. OpenCode spawn CHILD SESSION dengan subagent yg ditunjuk
 *   3. Subagent dapet system prompt + instruction dari parent
 *   4. Subagent ngerjain task di isolated context
 *   5. Hasilnya dikembalikan ke parent agent
 *
 * Parameter task tool:
 *   subagent_type  → nama agent (build, explore, general, atau custom)
 *   description    → ringkasan tugas
 *   prompt         → instruksi detail
 *
 * Task permissions di opencode.json:
 *   "permission": {
 *     "task": {
 *       "*": "deny",
 *       "explore": "allow",
 *       "code-reviewer": "ask"
 *     }
 *   }
 *
 * Contoh config agent orchestrator (cuma bisa delegate, gak bisa execute langsung):
 *
 *   "agent": {
 *     "orchestrator": {
 *       "description": "Koordinasi agent-agent specialist",
 *       "mode": "primary",
 *       "permission": {
 *         "edit": "deny",
 *         "bash": "deny",
 *         "read": "deny",
 *         "task": {
 *           "*": "allow"
 *         }
 *       }
 *     }
 *   }
 */

// ===================================================================
//  2. SUBTASK PART — Delegate dalam 1 session
// ===================================================================
/**
 * SubtaskPart: { type: "subtask", prompt, description, agent }
 *
 * Berbeda dengan task tool:
 *   - Task tool → bikin CHILD SESSION baru (isolated)
 *   - Subtask part → ganti agent dalam SESSION YANG SAMA (shared context)
 *
 * Cocok buat:
 *   - Multi-step workflow dalam 1 session
 *   - Pipeline: research → plan → implement → review
 *   - Agent handoff tanpa bikin session baru
 *
 * Contoh:
 */
export const subtaskDelegationExample = {
  "chat.message": async (input: any, output: any) => {
    const text = output.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join(" ")

    // Detect multi-step request
    if (text.toLowerCase().includes("full feature")) {
      // Pipeline: research → plan → implement → review
      output.parts.push({
        type: "subtask",
        prompt: "Research best practices dan cari referensi untuk fitur ini",
        description: "Research phase",
        agent: "explore",
      })
      output.parts.push({
        type: "subtask",
        prompt: "Buat plan implementasi berdasarkan research",
        description: "Planning phase",
        agent: "plan",
      })
      output.parts.push({
        type: "subtask",
        prompt: "Implementasi sesuai plan",
        description: "Implementation phase",
        agent: "build",
      })
      output.parts.push({
        type: "subtask",
        prompt: "Review hasil implementasi",
        description: "Code review phase",
        agent: "code-reviewer",
      })
    }
  },
}

// ===================================================================
//  3. AGENT PART — Switch agent di tengah session
// ===================================================================
/**
 * AgentPart: { type: "agent", name: string, source?: string }
 *
 * Berguna buat:
 *   - Ganti agent aktif tanpa subtask
 *   - Inject agent routing dari plugin
 *   - Multi-agent conversation dalam 1 session
 */
export const agentSwitchExample = {
  "chat.message": async (input: any, output: any) => {
    // Inject agent switch
    output.parts.push({
      type: "agent",
      name: "code-reviewer",
      source: "plugin",
    })

    // Kirim instruksi ke agent baru
    output.parts.push({
      type: "text",
      text: "Tolong review code di file src/auth/*.ts",
    })

    // Switch ke agent lain setelahnya
    output.parts.push({
      type: "agent",
      name: "build",
      source: "auto",
    })
  },
}

// ===================================================================
//  4. CHILD SESSIONS — Parent-child tree
// ===================================================================
/**
 * Task tool spawns CHILD SESSIONS.
 * Ini bikin tree structure:
 *
 *   Session A (parent - orchestrator)
 *   ├── Session B (child - explore)
 *   ├── Session C (child - build)
 *   └── Session D (child - code-reviewer)
 *
 * Navigasi:
 *   session_child_first  → masuk ke child session pertama
 *   session_child_cycle  → cycle ke child berikutnya
 *   session_parent       → kembali ke parent session
 *
 * SDK methods:
 *   client.session.children({ path: { id } })   → list child sessions
 *   client.session.messages({ path: { id } })   → baca hasil kerja child
 */

export async function inspectChildSessions(client: OpencodeClient, parentSessionId: string) {
  // List semua child session
  const raw = await client.session.children({ path: { id: parentSessionId } }) as any
  const children = raw.data ?? []

  console.log(`Parent session: ${parentSessionId}`)
  console.log(`Child sessions: ${children.length}`)

  for (const child of children) {
    console.log(`\n  ├─ ${child.id}: ${child.title ?? "(no title)"}`)

    // Baca messages dari child session
    const msgs = await client.session.messages({ path: { id: child.id } }) as any
    const data = msgs.data ?? []
    for (const msg of data) {
      const text = msg.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join(" ").substring(0, 100)
      console.log(`  │  [${msg.info.role}] ${text}...`)
    }
  }

  return children
}

// ===================================================================
//  5. FORK — Branch session
// ===================================================================
/**
 * Fork bikin session BARU dari message tertentu.
 * Berguna buat:
 *   - Experiment multiple approach
 *   - Bandingin hasil
 *   - Aman tanpa ganggu session utama
 */
export async function forkForParallel(client: OpencodeClient, sessionId: string, messageId: string) {
  const forked = await client.session.fork({
    path: { id: sessionId },
    body: { messageID: messageId },
  }) as any

  console.log(`Forked session: ${forked.data?.id}`)
  console.log(`Sekarang ada 2 session parallel: ${sessionId} & ${forked.data?.id}`)

  return forked.data?.id
}

// ===================================================================
//  6. MESSAGE PASSING — Kirim pesan antar agent via inbox
// ===================================================================
/**
 * Ini pattern dari community (agent teams):
 *   Setiap agent punya INBOX file (JSONL).
 *   Pesan ditulis ke inbox → di-inject ke session recipient.
 *
 * Flow:
 *   1. Agent A kirim pesan → tulis ke inbox Agent B
 *   2. Inject pesan sebagai user message di session Agent B
 *   3. Wake up Agent B kalo idle
 *   4. Agent B bales → tulis ke inbox Agent A
 *
 * Implementasi dengan SDK + hooks:
 */

// Inbox manager — simpan pesan antar agent
class AgentInbox {
  private messages: Array<{
    id: string
    from: string
    to: string
    text: string
    timestamp: number
    read: boolean
  }> = []

  send(from: string, to: string, text: string) {
    const msg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      from,
      to,
      text,
      timestamp: Date.now(),
      read: false,
    }
    this.messages.push(msg)
    return msg
  }

  read(to: string) {
    return this.messages.filter((m) => m.to === to && !m.read)
  }

  markRead(messageId: string) {
    const msg = this.messages.find((m) => m.id === messageId)
    if (msg) msg.read = true
  }

  all(to: string) {
    return this.messages.filter((m) => m.to === to)
  }
}

export const inbox = new AgentInbox()

// Plugin: message passing antar agent
export const agentMessagingExample = {
  tool: {
    // Tool: kirim pesan ke agent lain
    send_message: tool({
      description: "Kirim pesan ke agent lain. Agent akan menerima pesan ini di session mereka.",
      args: {
        to: tool.schema.string().describe("Nama agent tujuan"),
        text: tool.schema.string().describe("Isi pesan"),
      },
      async execute(args: any, ctx: any) {
        const msg = inbox.send(ctx.agent ?? "unknown", args.to, args.text)
        return `Pesan terkirim ke @${args.to} (ID: ${msg.id})`
      },
    }),

    // Tool: cek inbox
    check_inbox: tool({
      description: "Cek pesan yg belum dibaca dari agent lain",
      args: {},
      async execute(_args: any, ctx: any) {
        const msgs = inbox.read(ctx.agent ?? "unknown")
        if (msgs.length === 0) return "Tidak ada pesan baru."

        return msgs.map((m) => `[${m.id}] Dari @${m.from}: ${m.text}`).join("\n")
      },
    }),

    // Tool: koordinasi parallel tasks
    parallel_task: tool({
      description: "Jalankan task di MULTIPLE subagent secara parallel, lalu kumpulin hasilnya.",
      args: {
        tasks: tool.schema
          .string()
          .describe("JSON array of { agent, instruction }"),
      },
      async execute(args: any, ctx: any) {
        const tasks = JSON.parse(args.tasks)
        const results: string[] = []

        for (const t of tasks) {
          // Kirim instruksi ke masing-masing agent
          inbox.send(ctx.agent ?? "orchestrator", t.agent, t.instruction)
          results.push(`Task dikirim ke @${t.agent}: ${t.instruction}`)
        }

        return `Parallel tasks dispatched:\n${results.join("\n")}\n\nCek hasil pake check_inbox nanti.`
      },
    }),
  },

  // Hook: inject pesan inbox ke session
  "chat.message": async (input: any, output: any) => {
    const agentName = input.agent ?? "unknown"
    const unread = inbox.read(agentName)

    if (unread.length > 0) {
      // Inject pesan dari agent lain
      for (const msg of unread) {
        output.parts.push({
          type: "text",
          text: `[Pesan dari @${msg.from}]: ${msg.text}`,
          synthetic: true,
        })
        inbox.markRead(msg.id)
      }
    }
  },
}

// ===================================================================
//  7. ORCHESTRATOR PLUGIN — Full multi-agent coordination
// ===================================================================
//
//  Plugin orchestrator yg:
//    1. Terima request dari user
//    2. Breakdown ke sub-tasks
//    3. Deploy ke agent-agent specialist
//    4. Kumpulin hasil
//    5. Report back
//
//  export const OrchestratorPlugin: Plugin = async ({ client }) => {
//    const taskResults = new Map<string, string>()
//
//    return {
//      event: async ({ event }) => {
//        // Track child session completion
//        if (event.type === "session.idle") {
//          const sid = event.properties.sessionID
//
//          // Cek apakah ini child session dari orchestrator
//          const parent = await client.session.get({ path: { id: sid } })
//          if ((parent.data as any)?.parentID) {
//            // Baca hasil dari child session
//            const msgs = await client.session.messages({ path: { id: sid } })
//            const lastMsg = msgs.data?.at(-1)
//            const text = lastMsg?.parts
//              ?.filter((p: any) => p.type === "text")
//              .map((p: any) => p.text).join("\n")
//            taskResults.set(sid, text ?? "(no output)")
//          }
//        }
//
//        // Log coordination events
//        if (event.type === "session.status") {
//          const { sessionID, status } = event.properties
//          if (status.type === "busy") {
//            await client.app.log({
//              body: {
//                service: "orchestrator",
//                level: "info",
//                message: `Agent session ${sessionID} mulai ngerjain task`,
//              },
//            })
//          }
//        }
//      },
//
//      // Inject orchestration prompt
//      "chat.message": async (input, output) => {
//        output.parts.push({
//          type: "text",
//          text: `Kamu adalah orchestrator. Task status:
// - Tasks completed: ${taskResults.size}
// - Gunakan task() tool untuk delegate ke subagent
// - Jangan execute langsung, selalu delegate`,
//          synthetic: true,
//        })
//      },
//    }
//  }

// ===================================================================
//  8. AGENT TEAMS — Pattern dari community
// ===================================================================
/**
 * Agent Teams (inspired by Claude Code, ported to opencode):
 *
 * Arsitektur:
 *   ┌─────────────────────────────────────────┐
 *   │         Lead Agent (orchestrator)        │
 *   │  - Breakdown task                        │
 *   │  - Kirim ke specialist                   │
 *   │  - Kumpulin hasil                        │
 *   └────┬──────┬──────┬──────┬──────┬────────┘
 *        │      │      │      │      │
 *   ┌────┴┐ ┌──┴──┐ ┌┴───┐ ┌┴───┐ ┌┴────┐
 *   │Research│ │Plan │ │Code│ │Review│ │Docs │
 *   └────────┘ └─────┘ └────┘ └─────┘ └─────┘
 *
 * Mekanisme:
 *   1. Lead agent breakdown task → task tool ke subagent
 *   2. Tiap subagent kerja di CHILD SESSION sendiri
 *   3. Hasil dikembalikan ke lead agent
 *   4. Lead agent compile final output
 *
 * Keunggulan dibanding single agent:
 *   - Isolated context (gak overflow)
 *   - Bisa pake model berbeda tiap agent
 *   - Parallel execution
 *   - Better specialization
 */

// ===================================================================
//  9. CUSTOM TOOLS — Multi-agent coordination tools
// ===================================================================
export const coordinationTools = {
  tool: {
    // Coordinate multi-agent workflow
    workflow: tool({
      description: "Jalankan workflow multi-agent. Tiap step di-delegate ke agent spesifik secara berurutan.",
      args: {
        steps: tool.schema
          .string()
          .describe("JSON array of { agent, task }. Contoh: [{\"agent\":\"explore\",\"task\":\"Cari referensi\"},{\"agent\":\"build\",\"task\":\"Implementasi\"}]"),
      },
      async execute(args: any) {
        const steps = JSON.parse(args.steps)
        const plan = steps.map((s: any, i: number) =>
          `  ${i + 1}. @${s.agent}: ${s.task}`
        ).join("\n")

        return `Workflow plan:\n${plan}\n\nEksekusi berurutan:\n${steps.map((s: any) => `- Subtask: ${s.task} (agent: ${s.agent})`).join("\n")}`
      },
    }),

    // Collect results from child sessions
    collect_results: tool({
      description: "Kumpulin hasil dari semua child session yg udah selesai",
      args: {
        parentSessionId: tool.schema.string().describe("ID session parent (orchestrator)"),
      },
      async execute(args: any, ctx: any) {
        const children = await ctx.client.session.children({ path: { id: args.parentSessionId } }) as any
        const results: string[] = []

        for (const child of children.data ?? []) {
          const msgs = await ctx.client.session.messages({ path: { id: child.id } }) as any
          const last = msgs.data?.at(-1)
          const text = last?.parts
            ?.filter((p: any) => p.type === "text")
            .map((p: any) => p.text).join(" ")
            .substring(0, 200)

          results.push(`[${child.id}] ${child.title ?? "untitled"}:\n  ${text ?? "(no output)"}`)
        }

        return results.join("\n\n") || "Belum ada child session selesai."
      },
    }),
  },
}

// ===================================================================
//  10. EVENT-BASED COORDINATION
// ===================================================================
/**
 * Event yg berguna buat koordinasi antar agent:
 *
 *   session.created   → child session dibuat (task tool dipanggil)
 *   session.idle      → child session selesai kerja
 *   session.status    → status berubah (busy/idle/retry)
 *   session.error     → child session error
 *   message.updated   → ada message baru (hasil dari subagent)
 *   message.part.updated → real-time streaming antar agent
 */
export const coordinationEventsExample = {
  event: async ({ event }: { event: any }) => {
    switch (event.type) {
      case "session.created": {
        // Ada child session baru — task tool dipanggil
        const session = event.properties.info
        if (session.parentID) {
          console.log(`[Orchestrator] Agent session ${session.id} mulai bekerja (parent: ${session.parentID})`)
        }
        break
      }

      case "session.idle": {
        // Session selesai — ambil hasilnya
        const sid = event.properties.sessionID
        console.log(`[Orchestrator] Agent ${sid} selesai bekerja`)
        break
      }

      case "session.error": {
        // Ada yg error — notify agent lain atau retry
        const { sessionID, error } = event.properties
        console.error(`[Orchestrator] Agent ${sessionID} error:`, error)
        // Bisa trigger retry atau delegate ke agent lain
        break
      }

      case "session.status": {
        const { sessionID, status } = event.properties
        if (status.type === "retry") {
          console.log(`[Orchestrator] Agent ${sessionID} retry (${status.attempt}): ${status.message}`)
        }
        break
      }
    }
  },
}

// ===================================================================
//  RINGKASAN: Inter-Agent Communication Patterns
// ===================================================================
//
//  ┌────────────────────────────────────────────────────────────────────┐
//  │  Pattern              │  Mekanisme          │  Isolated Context   │
//  ├────────────────────────────────────────────────────────────────────┤
//  │  Task Tool            │  Child session      │  ✅ Ya               │
//  │  Subtask Part         │  Same session       │  ❌ Tidak (shared)  │
//  │  Agent Part           │  Switch agent       │  ❌ Tidak           │
//  │  Fork                 │  Branch session     │  ✅ Ya               │
//  │  Message Passing      │  Inbox + inject     │  ✅ Ya (per agent)  │
//  │  Event Coordination   │  Event hooks        │  ❌ (broadcast)     │
//  └────────────────────────────────────────────────────────────────────┘
//
//  Use cases:
//    Task Tool       → Isolated work, parallel execution, specialist agents
//    Subtask Part    → Pipeline dalam 1 session (shared context penting)
//    Agent Part      → Ganti agent cepat tanpa overhead
//    Fork            → Eksperimen / A/B testing
//    Message Passing → Complex multi-agent conversation (agent teams)
//    Events          → Monitoring, logging, auto-retry
