import type { Plugin } from "@opencode-ai/plugin";
import * as fs from "fs";
import * as path from "path";

const DIR = path.join(process.cwd() || ".", ".opencode");
const LOG = path.join(DIR, "messaging.log");
const INBOX = path.join(DIR, "messaging-inbox.json");

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

function log(text: string) {
  try { fs.appendFileSync(LOG, text, "utf-8"); } catch { /* silent */ }
}

function readInbox(): Array<Record<string, unknown>> {
  try {
    if (fs.existsSync(INBOX))
      return JSON.parse(fs.readFileSync(INBOX, "utf-8"));
  } catch { /* ignore */ }
  return [];
}

function saveInbox(m: unknown[]) {
  fs.writeFileSync(INBOX, JSON.stringify(m, null, 2), "utf-8");
}

const AGENTS = [
  { id: "pm", name: "Project Manager", emoji: "👔" },
  { id: "architect", name: "Architect", emoji: "🏗️" },
  { id: "developer", name: "Developer", emoji: "👨‍💻" },
  { id: "qa", name: "QA Engineer", emoji: "🧪" },
  { id: "devops", name: "DevOps", emoji: "⚙️" },
];

export default (() => {
  log("🚀 MESSAGING PLUGIN STARTED\n");

  return {
    tool: {
      inter_agent_demo_help: {
        description: "Menampilkan bantuan semua tool inter-agent messaging.",
        parameters: {},
        execute: async () => {
          let out = `╔════════════════════════════════════════════════╗\n`;
          out += `║  🤖  INTER-AGENT MESSAGING                   ║\n`;
          out += `╚════════════════════════════════════════════════╝\n\n`;
          out += `📋 Tools:\n`;
          out += `  inter_agent_send         📤 Kirim pesan antar agent\n`;
          out += `  inter_agent_inbox        📨 Lihat pesan masuk\n`;
          out += `  inter_agent_conversation 💬 Lihat thread percakapan\n\n`;
          out += `Agent: pm, architect, developer, qa, devops\n`;
          out += `Types: result, review_request, review_response, clarification, approval, revision\n\n`;
          out += `📁 ${LOG}\n📁 ${INBOX}\n`;
          return out;
        },
      },

      inter_agent_send: {
        description: "📤 Kirim pesan antar agent.",
        parameters: {
          from: { type: "string", enum: ["pm", "architect", "developer", "qa", "devops"], description: "Pengirim" },
          to: { type: "string", enum: ["pm", "architect", "developer", "qa", "devops"], description: "Penerima" },
          type: { type: "string", enum: ["result", "review_request", "review_response", "clarification", "approval", "revision"], description: "Tipe" },
          message: { type: "string", description: "Isi pesan" },
          taskId: { type: "string", description: "Task ID" },
        },
        execute: async ({ from, to, type, message, taskId }: Record<string, string>) => {
          const s = AGENTS.find((a) => a.id === from);
          const r = AGENTS.find((a) => a.id === to);
          if (!s || !r) return "❌ Role tidak valid.";
          const tid = taskId || `msg-${Date.now()}`;
          const emoji: Record<string, string> = { result: "✅", review_request: "🔍", review_response: "📝", clarification: "❓", approval: "👍", revision: "🔄" };
          const inbox = readInbox();
          inbox.push({ from, to, type, message, time: new Date().toISOString(), taskId: tid, read: false });
          saveInbox(inbox);
          log(`📨 ${from}→${to} [${type}] ${message}\n`);
          return `╔══════════════════════════════════════════╗\n║  📨  PESAN TERKIRIM                  ║\n╚══════════════════════════════════════════╝\n\n${s.emoji} ${s.name} → ${r.emoji} ${r.name}\n${emoji[type] || "📨"} ${type}\n🆔 ${tid}\n💬 "${message}"\n\n📁 ${LOG}\n`;
        },
      },

      inter_agent_inbox: {
        description: "📨 Lihat pesan masuk.",
        parameters: {
          role: { type: "string", enum: ["pm", "architect", "developer", "qa", "devops", "all"], description: "Filter role" },
          status: { type: "string", enum: ["all", "unread"], description: "Filter status" },
        },
        execute: async ({ role, status }: { role?: string; status?: string }) => {
          let msgs = readInbox();
          const r = role || "all";
          if (r !== "all") msgs = msgs.filter((m) => m.from === r || m.to === r);
          if (status === "unread") msgs = msgs.filter((m) => !m.read);
          if (msgs.length === 0) return "📭 Inbox kosong.";
          const emoji: Record<string, string> = { result: "✅", review_request: "🔍", review_response: "📝", clarification: "❓", approval: "👍", revision: "🔄" };
          let out = `╔══════════════════════════════════════════╗\n║  📨  INBOX${r === "all" ? " ALL" : " " + r.toUpperCase()}${status === "unread" ? " (UNREAD)" : ""}${" ".repeat(20)}\n╚══════════════════════════════════════════╝\n\n`;
          const grouped: Record<string, typeof msgs> = {};
          for (const m of msgs) {
            const k = (m.taskId as string) || "?";
            if (!grouped[k]) grouped[k] = [];
            grouped[k].push(m);
          }
          for (const [tid, group] of Object.entries(grouped)) {
            out += `  🆔 ${tid}\n`;
            for (const m of group) {
              const a = AGENTS.find((x) => x.id === m.from);
              const te = emoji[m.type as string] || "📨";
              const unreadTag = m.read ? "" : " 🆕";
              out += `    ${a?.emoji || "🤖"} ${m.from} ${te} [${m.type}]${unreadTag}\n      "${(m.message as string).substring(0, 80)}"\n`;
            }
          }
          out += `\n📁 ${INBOX}\n`;
          return out;
        },
      },

      inter_agent_conversation: {
        description: "💬 Lihat thread percakapan.",
        parameters: {
          taskId: { type: "string", description: "Task ID" },
        },
        execute: async ({ taskId }: { taskId: string }) => {
          if (!taskId) return "❌ Parameter taskId wajib.";
          const all = readInbox();
          const thread = all.filter((m) => m.taskId === taskId);
          if (thread.length === 0) return `📭 Tidak ada percakapan untuk "${taskId}".`;
          const emoji: Record<string, string> = { result: "✅", review_request: "🔍", review_response: "📝", clarification: "❓", approval: "👍", revision: "🔄" };
          let out = `╔══════════════════════════════════════════╗\n║  💬  ${taskId.substring(0, 28).padEnd(28)}║\n╚══════════════════════════════════════════╝\n\n`;
          for (let i = 0; i < thread.length; i++) {
            const m = thread[i];
            const s = AGENTS.find((a) => a.id === m.from);
            const r = AGENTS.find((a) => a.id === m.to);
            out += `  [${i + 1}] ${s?.emoji || "🤖"} ${s?.name || m.from} → ${r?.emoji || "🤖"} ${r?.name || m.to}\n  ${emoji[m.type as string] || "📨"} ${(m.type as string).toUpperCase()}\n  💬 "${(m.message as string).substring(0, 80)}"\n  ⏱ ${m.time}\n\n`;
          }
          out += `📁 ${LOG}\n`;
          return out;
        },
      },
    },
  };
}) satisfies Plugin;
