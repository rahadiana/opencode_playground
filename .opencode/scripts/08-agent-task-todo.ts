/**
 * ==========================================================
 *  Agent, Task, & Todo Management — OpenCode SDK
 * ==========================================================
 *
 * Cara manage agents, sub-tasks, dan todo list via:
 *   - SDK client methods
 *   - Plugin hooks
 *   - Part types (subtask, agent)
 *
 * Sumber: SDK-REFERENCE.md + https://opencode.ai/docs/
 */

import { tool } from "@opencode-ai/plugin"
import type { OpencodeClient } from "@opencode-ai/sdk"

// ===================================================================
//  1. LIST AGENTS via SDK
// ===================================================================
/**
 * Signature:
 *   client.app.agents()
 *
 * Output:
 *   Agent[] = [{
 *     name: string           // "build", "ask", "plan", dll
 *     description?: string   // Penjelasan agent
 *     mode: "subagent" | "primary" | "all"
 *     builtIn: boolean
 *     permission: { edit, bash, webfetch?, doom_loop?, external_directory? }
 *     model?: { modelID, providerID }
 *     prompt?: string        // Custom system prompt
 *     tools: { [key: string]: boolean }  // Tool yg diaktifkan
 *     options: {}
 *     maxSteps?: number
 *     temperature?: number
 *     topP?: number
 *     color?: string
 *   }]
 *
 * Contoh:
 */
export async function listAgents(client: OpencodeClient) {
  const raw = await client.app.agents() as any
  for (const agent of raw.data ?? []) {
    console.log(`Agent: ${agent.name}`)
    console.log(`  Description: ${agent.description ?? "-"}`)
    console.log(`  Mode: ${agent.mode}`)
    console.log(`  Built-in: ${agent.builtIn}`)
    if (agent.model) console.log(`  Model: ${agent.model.providerID}/${agent.model.modelID}`)
    if (agent.prompt) console.log(`  Prompt: ${agent.prompt.substring(0, 60)}...`)
    if (agent.tools) {
      const enabled = Object.entries(agent.tools).filter(([, v]) => v).map(([k]) => k)
      console.log(`  Tools: ${enabled.join(", ")}`)
    }
    if (agent.maxSteps) console.log(`  Max steps: ${agent.maxSteps}`)
    if (agent.temperature) console.log(`  Temperature: ${agent.temperature}`)
    console.log("")
  }
}

// ===================================================================
//  2. SWITCH AGENT via session.prompt()
// ===================================================================
/**
 * Waktu kirim prompt, kita bisa pilih agent mana yg ngerjain.
 * Berguna kalo mau routing task ke agent spesifik.
 *
 * Field `agent` di body:
 *   "build"  → nulis & execute code
 *   "ask"    → jawab pertanyaan (read-only)
 *   "plan"   → bikin rencana (gak boleh edit file)
 *
 * Contoh:
 */
export async function promptWithAgent(
  client: OpencodeClient,
  sessionId: string,
  agent: string = "build"
) {
  const r = await client.session.prompt({
    path: { id: sessionId },
    body: {
      parts: [{ type: "text" as const, text: "Refactor function X" }],
      agent,  // routing ke agent tertentu
    },
  })
  console.log(`Prompt menggunakan agent: ${agent}`)
  return r
}

// ===================================================================
//  3. SUBTASK PART — Delegate sub-task ke agent lain
// ===================================================================
/**
 * SubtaskPart (type: "subtask"):
 *   { type: "subtask", prompt: string, description: string, agent: string }
 *
 * Bisa dipake di plugin hooks:
 *   - chat.message (input)
 *   - command.execute.before (output)
 *
 * Part types:
 *   subtask  → delegate task ke agent tertentu
 *   agent    → ganti agent di tengah session
 *   step-start / step-finish → tracking progress
 *   retry    → handle retry
 *   reasoning → chain-of-thought
 *
 * Contoh inject subtask via hook:
 */
export const subtaskHookExample = {
  "chat.message": async (input: any, output: any) => {
    // Inject subtask: suruh agent "ask" riset dulu
    output.parts.push({
      type: "subtask",
      prompt: "Cari tau best practice refactoring di codebase ini",
      description: "Research phase",
      agent: "ask",
    })

    // Inject subtask: baru kerjain
    output.parts.push({
      type: "subtask",
      prompt: "Refactor sesuai hasil research",
      description: "Implementation phase",
      agent: "build",
    })

    // Inject agent part: ganti agent aktif
    output.parts.push({
      type: "agent",
      name: "plan",
      source: "user",
    })
  },
}

// ===================================================================
//  4. TODO LIST via SDK
// ===================================================================
/**
 * Signature:
 *   client.session.todo({ path: { id } })
 *
 * Output:
 *   Todo[] = [{
 *     content: string    // Deskripsi task
 *     status: string     // "pending" | "in_progress" | "completed" | "cancelled"
 *     priority: string   // "high" | "medium" | "low"
 *     id: string
 *   }]
 *
 * Catatan: SDK saat ini read-only untuk todos.
 * Buat modify todos, bisa via hook "todo.updated" atau prompt ke AI untuk update.
 *
 * Contoh:
 */
export async function getTodos(client: OpencodeClient, sessionId: string) {
  const raw = await client.session.todo({ path: { id: sessionId } }) as any
  const todos = raw.data ?? []
  for (const t of todos) {
    const icon = t.status === "completed" ? "✅" : t.status === "in_progress" ? "🔄" : "⬜"
    const prio = t.priority === "high" ? "🔴" : t.priority === "medium" ? "🟡" : "🟢"
    console.log(`${icon} [${prio}] ${t.content} (${t.status})`)
  }
  return todos
}

// ===================================================================
//  5. TODO — Listen perubahan via hook
// ===================================================================
/**
 * Event todo.updated:
 *   { type: "todo.updated", properties: { sessionID: string; todos: Todo[] } }
 *
 * Bisa dipake buat:
 *   - Logging progress
 *   - Notifikasi kalo ada todo selesai
 *   - Sync ke external system
 *
 * Contoh:
 */
export const todoHookExample = {
  event: async ({ event }: { event: any }) => {
    if (event.type === "todo.updated") {
      const { sessionID, todos } = event.properties
      const completed = todos.filter((t: any) => t.status === "completed")
      const inProgress = todos.filter((t: any) => t.status === "in_progress")
      const high = todos.filter((t: any) => t.priority === "high" && t.status !== "completed")

      console.log(`[Todo] Session ${sessionID}:`)
      console.log(`  Total: ${todos.length}`)
      console.log(`  Selesai: ${completed.length}`)
      console.log(`  Dikerjain: ${inProgress.length}`)
      if (high.length > 0) {
        console.log(`  High priority belum selesai:`)
        for (const t of high) console.log(`    - ${t.content}`)
      }
    }
  },
}

// ===================================================================
//  6. TODO — Minta AI update / bikin todo lewat prompt
// ===================================================================
/**
 * Kalo SDK gak ada method buat create/update todo,
 * kita bisa minta AI buat ngelakuinnya lewat prompt.
 *
 * Strategi:
 *   1. Inject system prompt yg nyuruh AI maintain todo
 *   2. Todo nanti ke-update otomatis via event
 *
 * Contoh inject system prompt:
 */
export const todoSystemPrompt = {
  "chat.message": async (input: any, output: any) => {
    // Inject instruksi todo management
    output.parts.push({
      type: "text",
      text: `IMPORTANT: Kamu harus maintain todo list.
- Kalo mulai ngerjain sesuatu, bikin todo dengan status "in_progress"
- Kalo selesai, update todo ke "completed"
- Prioritaskan task yang penting
- Format todo: "content" (deskripsi singkat)`,
      synthetic: true,
    })
  },
}

// ===================================================================
//  7. SESSION STATUS — Monitor progress task
// ===================================================================
/**
 * Signature:
 *   client.session.status()
 *
 * Output:
 *   Record<string, SessionStatus>
 *   SessionStatus = { type: "idle" }
 *                 | { type: "busy" }
 *                 | { type: "retry"; attempt: number; message: string; next: number }
 *
 * Contoh:
 */
export async function monitorSessions(client: OpencodeClient) {
  const raw = await client.session.status() as any
  for (const [id, status] of Object.entries(raw.data ?? {})) {
    const s = status as any
    switch (s.type) {
      case "idle":
        console.log(`[${id}] Idle — siap`)
        break
      case "busy":
        console.log(`[${id}] Busy — sedang ngerjain task`)
        break
      case "retry":
        console.log(`[${id}] Retry attempt ${s.attempt}: ${s.message}`)
        break
    }
  }
}

// ===================================================================
//  8. SESSION STATUS via event hook
// ===================================================================
export const sessionStatusHookExample = {
  event: async ({ event }: { event: any }) => {
    if (event.type === "session.status") {
      const { sessionID, status } = event.properties
      const icons: Record<string, string> = { idle: "💤", busy: "⚡", retry: "🔄" }
      console.log(`${icons[status.type] ?? "?"} Session ${sessionID}: ${status.type}`)

      if (status.type === "retry") {
        console.log(`  Attempt ${status.attempt}: ${status.message}`)
      }
    }

    if (event.type === "session.error") {
      console.error(`❌ Session ${event.properties.sessionID} error:`, event.properties.error)
    }
  },
}

// ===================================================================
//  9. FORK SESSION — Branching task
// ===================================================================
/**
 * Signature:
 *   client.session.fork({ path: { id }, body: { messageID } })
 *
 * Fork session di message tertentu.
 * Berguna buat:
 *   - Experiment tanpa ganggu session utama
 *   - Branching task
 *   - Multiple approach
 *
 * Contoh:
 */
export async function forkSession(client: OpencodeClient, sessionId: string, messageId: string) {
  const r = await client.session.fork({
    path: { id: sessionId },
    body: { messageID: messageId },
  }) as any
  console.log("Forked session:", r.data?.id)
  return r.data?.id
}

// ===================================================================
//  10. REGISTER CUSTOM AGENT — Tool untuk manage agent
// ===================================================================
/**
 * Custom tool buat switch agent atau manage task.
 * Bisa dipanggil AI secara otomatis.
 */
export const agentToolsExample = {
  tool: {
    // Tool: switch agent
    switch_agent: tool({
      description: "Ganti agent aktif di session. Agent: build (ngoding), ask (tanya), plan (rencana), atau custom",
      args: {
        agent: tool.schema
          .string()
          .describe("Nama agent: 'build', 'ask', 'plan'"),
      },
      async execute(args) {
        return `Switch agent ke ${args.agent} — tinggal inject agent part di prompt`
      },
    }),

    // Tool: track progress step
    track_step: tool({
      description: "Catat progress step task untuk monitoring",
      args: {
        step: tool.schema.string().describe("Nama step yg dikerjain"),
        status: tool.schema
          .string()
          .describe("Status: 'started', 'in_progress', 'completed', 'blocked'"),
        notes: tool.schema.string().optional().describe("Catatan tambahan"),
      },
      async execute(args) {
        const icons: Record<string, string> = {
          started: "🟡",
          in_progress: "🔄",
          completed: "✅",
          blocked: "🔴",
        }
        return `${icons[args.status] ?? "⬜"} [${args.status}] ${args.step}${args.notes ? ` — ${args.notes}` : ""}`
      },
    }),
  },
}

// ===================================================================
//  11. COMPLETE EXAMPLE — Agent Manager Plugin
// ===================================================================
//
//  Plugin yg nge-monitor agent switching, todo updates, dan task progress.
//
//  export const AgentManager: Plugin = async ({ client, $ }) => {
//    const taskLog: Array<{ time: number; sessionID: string; task: string; status: string }> = []
//
//    return {
//      event: async ({ event }) => {
//        // Track session lifecycle
//        if (event.type === "session.created") {
//          console.log(`Session baru: ${event.properties.info.id}`)
//        }
//
//        // Track todo changes
//        if (event.type === "todo.updated") {
//          const { sessionID, todos } = event.properties
//          // Sync ke external system
//          await $`curl -X POST https://api.example.com/todos \
//            -H "Content-Type: application/json" \
//            -d ${JSON.stringify({ sessionID, todos })}`
//        }
//
//        // Track agent activity via message parts
//        if (event.type === "message.part.updated") {
//          const part = event.properties.part
//          if (part?.type === "agent") {
//            console.log(`Agent switch: ${part.name}`)
//          }
//          if (part?.type === "subtask") {
//            taskLog.push({
//              time: Date.now(),
//              sessionID: event.properties.sessionID ?? "",
//              task: part.description ?? part.prompt ?? "-",
//              status: "started",
//            })
//          }
//          if (part?.type === "step-finish") {
//            console.log(`Step selesai: reason=${part.reason}, cost=${part.cost}`)
//          }
//        }
//
//        // Track session errors
//        if (event.type === "session.error") {
//          await client.app.log({
//            body: {
//              service: "agent-manager",
//              level: "error",
//              message: `Session ${event.properties.sessionID} error`,
//              extra: { error: event.properties.error },
//            },
//          })
//        }
//      },
//
//      // Inject agent instructions
//      "chat.message": async (input, output) => {
//        output.parts.push({
//          type: "text",
//          text: `Current task progress: ${taskLog.filter(t => t.status !== "completed").length} tasks remaining`,
//          synthetic: true,
//        })
//      },
//    }
//  }

// ===================================================================
//  RINGKASAN API
// ===================================================================
//
//  Agent:
//    client.app.agents()              → list semua agent + tools + permissions
//    session.prompt({ body: { agent }}) → kirim prompt ke agent tertentu
//    Part type "agent"                → ganti agent di tengah session
//    Part type "subtask"              → delegate sub-task ke agent lain
//    Hooks: chat.message              → inject agent routing
//
//  Task / Progress:
//    Part type "subtask"              → track task breakdown
//    Part type "step-start"           → mulai step
//    Part type "step-finish"          → selesai step (dengan cost & reason)
//    Part type "reasoning"            → chain-of-thought
//    Part type "retry"                → handle retry attempts
//    Event "session.status"           → monitor busy/idle/retry
//    Event "session.error"            → track errors
//    Event "session.idle"             → session selesai
//
//  Todo:
//    client.session.todo({ path })    → read todo list
//    Event "todo.updated"             → hook perubahan todo
//    client.app.log()                 → log progress
