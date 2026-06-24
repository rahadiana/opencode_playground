import type { Plugin } from "@opencode-ai/plugin";
import * as fs from "fs";
import * as path from "path";

const LOG_DIR = path.join(process.cwd() || ".", ".opencode");
const LOG_FILE = path.join(LOG_DIR, "inter-agent-demo.log");
const INBOX_FILE = path.join(LOG_DIR, "inbox.json");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function writeLog(text: string) {
  try {
    fs.appendFileSync(LOG_FILE, text, "utf-8");
  } catch {
    // silent
  }
}

function log(emoji: string, msg: string, data?: unknown) {
  const ts = new Date().toISOString();
  let line = `[${ts}] ${emoji} ${msg}`;
  if (data) line += `\n${JSON.stringify(data, null, 2)}`;
  line += "\n";
  writeLog(line);
}

function readInbox(): Array<{ from: string; type: string; message: string; time: string; taskId?: string; read: boolean }> {
  try {
    if (fs.existsSync(INBOX_FILE)) {
      return JSON.parse(fs.readFileSync(INBOX_FILE, "utf-8"));
    }
  } catch { /* ignore */ }
  return [];
}

function saveInbox(messages: unknown[]) {
  fs.writeFileSync(INBOX_FILE, JSON.stringify(messages, null, 2), "utf-8");
}

const AGENT_ROLES = [
  { id: "pm", name: "Project Manager", emoji: "👔" },
  { id: "architect", name: "Architect", emoji: "🏗️" },
  { id: "developer", name: "Developer", emoji: "👨‍💻" },
  { id: "qa", name: "QA Engineer", emoji: "🧪" },
  { id: "devops", name: "DevOps", emoji: "⚙️" },
];

const PIPELINE_TEMPLATES: Record<string, { stages: string[]; description: string }> = {
  "feature": {
    stages: ["pm", "architect", "developer", "qa"],
    description: "PM → Architect → Developer → QA (full feature pipeline)",
  },
  "bugfix": {
    stages: ["pm", "developer", "qa"],
    description: "PM → Developer → QA (quick bugfix pipeline)",
  },
  "review": {
    stages: ["developer", "qa"],
    description: "Developer → QA (code review only)",
  },
};

export default (() => {
  log("🚀", "INTER-AGENT DEMO PLUGIN STARTED");

  return {
    tool: {
      inter_agent_demo_help: {
        description:
          "Menampilkan bantuan untuk semua tool inter-agent communication demo.",
        parameters: {},
        execute: async () => {
          let out = "";
          const b = "════════════════════════════════════════════════";
          out += `╔${b}╗\n`;
          out += `║  🤖  INTER-AGENT COMMUNICATION DEMO           ║\n`;
          out += `╚${b}╝\n\n`;

          out += `📋 Daftar tools:\n\n`;

          out += `┌─────────────────────────────────────────────────────────────────┐\n`;
          out += `│ 1. inter_agent_inbox                                          │\n`;
          out += `│    📨 Lihat pesan yang masuk ke inbox antar agent              │\n`;
          out += `│    Parameter: status=all|unread, role=pm|architect|...         │\n`;
          out += `├─────────────────────────────────────────────────────────────────┤\n`;
          out += `│ 2. inter_agent_send                                            │\n`;
          out += `│    📤 Kirim pesan dari satu agent ke agent lain                │\n`;
          out += `│    Parameter: from, to, type, message, taskId                  │\n`;
          out += `├─────────────────────────────────────────────────────────────────┤\n`;
          out += `│ 3. inter_agent_pipeline                                        │\n`;
          out += `│    🏗️  Jalankan pipeline multi-agent (PM→Arch→Dev→QA)         │\n`;
          out += `│    Parameter: template=feature|bugfix|review, featureName      │\n`;
          out += `├─────────────────────────────────────────────────────────────────┤\n`;
          out += `│ 4. inter_agent_conversation                                    │\n`;
          out += `│    💬 Lihat thread percakapan berdasarkan taskId               │\n`;
          out += `│    Parameter: taskId                                           │\n`;
          out += `├─────────────────────────────────────────────────────────────────┤\n`;
          out += `│ 5. inter_agent_board                                           │\n`;
          out += `│    📊 Papan status semua agent dan task yang sedang berjalan   │\n`;
          out += `│    Parameter: (none)                                           │\n`;
          out += `└─────────────────────────────────────────────────────────────────┘\n\n`;

          out += `💡 Tips:\n`;
          out += `   • Setiap agent punya role berbeda: PM, Architect, Developer, QA, DevOps\n`;
          out += `   • Gunakan taskId yang sama untuk thread percakapan\n`;
          out += `   • Message types: result, review_request, review_response, clarification, approval, revision\n`;
          out += `   • Pipeline otomatis mengirim pesan antar stage\n\n`;

          out += `📁 Log file: ${LOG_FILE}\n`;
          return out;
        },
      },

      inter_agent_send: {
        description:
          "📤 Kirim pesan dari satu agent ke agent lain. Mensimulasikan inter-agent messaging.",
        parameters: {
          from: {
            type: "string",
            enum: ["pm", "architect", "developer", "qa", "devops"],
            description: "Pengirim pesan",
          },
          to: {
            type: "string",
            enum: ["pm", "architect", "developer", "qa", "devops"],
            description: "Penerima pesan",
          },
          type: {
            type: "string",
            enum: ["result", "review_request", "review_response", "clarification", "approval", "revision"],
            description: "Tipe pesan",
          },
          message: {
            type: "string",
            description: "Isi pesan",
          },
          taskId: {
            type: "string",
            description: "ID task (untuk grouping thread)",
          },
        },
        execute: async ({
          from, to, type, message, taskId,
        }: { from: string; to: string; type: string; message: string; taskId?: string }) => {
          const sender = AGENT_ROLES.find((r) => r.id === from);
          const receiver = AGENT_ROLES.find((r) => r.id === to);
          if (!sender || !receiver) {
            return "❌ Role tidak valid. Gunakan: pm, architect, developer, qa, devops";
          }
          const tid = taskId || `task-${Date.now()}`;

          const typeEmojis: Record<string, string> = {
            result: "✅",
            review_request: "🔍",
            review_response: "📝",
            clarification: "❓",
            approval: "👍",
            revision: "🔄",
          };

          const inbox = readInbox();
          inbox.push({
            from,
            type,
            message,
            time: new Date().toISOString(),
            taskId: tid,
            read: false,
          });
          saveInbox(inbox);

          const te = typeEmojis[type] || "📨";

          log("📨", `Pesan terkirim: ${from} → ${to} [${type}]`, {
            taskId: tid,
            message,
          });

          let out = "";
          out += `╔══════════════════════════════════════════╗\n`;
          out += `║  📨  PESAN TERKIRIM                       ║\n`;
          out += `╚══════════════════════════════════════════╝\n\n`;
          out += `  ${sender.emoji} ${sender.name} → ${receiver.emoji} ${receiver.name}\n`;
          out += `  ${te} Type: ${type}\n`;
          out += `  🆔 Task  : ${tid}\n`;
          out += `  💬 Pesan : "${message}"\n\n`;
          out += `  📁 Log   : ${LOG_FILE}\n`;

          return out;
        },
      },

      inter_agent_inbox: {
        description:
          "📨 Lihat pesan yang masuk ke inbox antar agent.",
        parameters: {
          role: {
            type: "string",
            enum: ["pm", "architect", "developer", "qa", "devops", "all"],
            description: "Filter berdasarkan role penerima (default: all)",
          },
          status: {
            type: "string",
            enum: ["all", "unread"],
            description: "Filter status baca (default: all)",
          },
        },
        execute: async ({ role, status }: { role?: string; status?: string }) => {
          let messages = readInbox();
          const r = role || "all";

          if (r !== "all") {
            messages = messages.filter((m) => m.from === r || m.to === r);
          }
          if (status === "unread") {
            messages = messages.filter((m) => !m.read);
          }

          if (messages.length === 0) {
            return "📭 Inbox kosong.";
          }

          const typeEmojis: Record<string, string> = {
            result: "✅", review_request: "🔍", review_response: "📝",
            clarification: "❓", approval: "👍", revision: "🔄",
          };

          let out = "";
          out += `╔══════════════════════════════════════════╗\n`;
          out += `║  📨  INBOX ${r === "all" ? "SEMUA AGENT" : r.toUpperCase()}${status === "unread" ? " (UNREAD)" : ""}    ║\n`;
          out += `╚══════════════════════════════════════════╝\n\n`;

          const grouped: Record<string, typeof messages> = {};
          for (const m of messages) {
            const key = m.taskId || "no-task";
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(m);
          }

          for (const [taskId, msgs] of Object.entries(grouped)) {
            out += `  🆔 Task: ${taskId}\n`;
            for (const m of msgs) {
              const sender = AGENT_ROLES.find((a) => a.id === m.from);
              const te = typeEmojis[m.type] || "📨";
              out += `    ${sender?.emoji || "🤖"} ${m.from} ${te} [${m.type}] ${m.read ? "" : "🆕"}\n`;
              out += `      "${m.message}"\n`;
              out += `      ⏱ ${m.time}\n`;
            }
            out += "\n";
          }

          out += `\n📁 ${INBOX_FILE}\n`;
          return out;
        },
      },

      inter_agent_conversation: {
        description:
          "💬 Lihat thread percakapan antar agent berdasarkan taskId.",
        parameters: {
          taskId: {
            type: "string",
            description: "ID task untuk melihat thread percakapan",
          },
        },
        execute: async ({ taskId }: { taskId: string }) => {
          if (!taskId) return "❌ Parameter taskId wajib diisi.";

          const allMessages = readInbox();
          const thread = allMessages.filter((m) => m.taskId === taskId);

          if (thread.length === 0) {
            return `📭 Tidak ada percakapan untuk task "${taskId}".`;
          }

          const typeEmojis: Record<string, string> = {
            result: "✅", review_request: "🔍", review_response: "📝",
            clarification: "❓", approval: "👍", revision: "🔄",
          };

          let out = "";
          const b = "══════════════════════════════════════════";
          out += `╔${b}╗\n`;
          out += `║  💬  PERCAKAPAN: ${taskId.padEnd(25)}║\n`;
          out += `╚${b}╝\n\n`;

          for (let i = 0; i < thread.length; i++) {
            const m = thread[i];
            const sender = AGENT_ROLES.find((a) => a.id === m.from);
            const receiver = AGENT_ROLES.find((a) => a.id === m.to);
            const te = typeEmojis[m.type] || "📨";

            out += `  ${"─".repeat(40)}\n`;
            out += `  [${i + 1}] ${sender?.emoji || "🤖"} ${sender?.name || m.from} → ${receiver?.emoji || "🤖"} ${receiver?.name || m.to}\n`;
            out += `  ${te} ${m.type.toUpperCase()}\n`;
            out += `  💬 "${m.message}"\n`;
            out += `  ⏱ ${m.time}\n`;
          }
          out += `  ${"─".repeat(40)}\n\n`;

          out += `📁 ${LOG_FILE}\n`;
          return out;
        },
      },

      inter_agent_pipeline: {
        description:
          "🏗️  Jalankan pipeline multi-agent. Mensimulasikan alur kerja PM→Architect→Developer→QA.",
        parameters: {
          template: {
            type: "string",
            enum: ["feature", "bugfix", "review"],
            description: "Template pipeline (default: feature)",
          },
          featureName: {
            type: "string",
            description: "Nama fitur/bug yang akan dikerjakan",
          },
        },
        execute: async ({ template, featureName }: { template?: string; featureName?: string }) => {
          const tpl = template || "feature";
          const cfg = PIPELINE_TEMPLATES[tpl];
          if (!cfg) return `❌ Template "${tpl}" tidak dikenal.`;

          const name = featureName || "fitur-demo";
          const taskId = `pipeline-${tpl}-${Date.now()}`;
          const inbox = readInbox();

          const stageMessages: Record<string, { from: string; to: string; type: string; message: string }[]> = {
            feature: [
              { from: "pm", to: "architect", type: "result", message: `Buat desain arsitektur untuk fitur: "${name}"` },
              { from: "architect", to: "developer", type: "result", message: `Desain selesai. Implementasi: buat komponen baru + unit test untuk "${name}"` },
              { from: "developer", to: "qa", type: "review_request", message: `Implementasi "${name}" selesai. Mohon direview.` },
              { from: "qa", to: "developer", type: "approval", message: `Review selesai. "${name}" siap di-deploy. 👍` },
            ],
            bugfix: [
              { from: "pm", to: "developer", type: "result", message: `Ada bug pada "${name}". Tolong diperbaiki segera.` },
              { from: "developer", to: "qa", type: "review_request", message: `Fix untuk "${name}" sudah siap. Mohon diuji.` },
              { from: "qa", to: "developer", type: "approval", message: `Bug "${name}" sudah terverifikasi. Siap rilis. 👍` },
            ],
            review: [
              { from: "developer", to: "qa", type: "review_request", message: `Code review untuk: "${name}"` },
              { from: "qa", to: "developer", type: "review_response", message: `Beberapa catatan: refactor fungsi X, tambah error handling.` },
              { from: "developer", to: "qa", type: "result", message: `Sudah diperbaiki sesuai review.` },
              { from: "qa", to: "developer", type: "approval", message: `LGTM! Approved. ✅` },
            ],
          };

          const stages = stageMessages[tpl];
          if (!stages) return "❌ Template tidak ditemukan.";

          for (const s of stages) {
            inbox.push({
              from: s.from,
              to: s.to,
              type: s.type,
              message: s.message,
              time: new Date().toISOString(),
              taskId,
              read: false,
            });
          }
          saveInbox(inbox);

          const stageLabels: Record<string, string> = {
            pm: "👔 PM",
            architect: "🏗️ Architect",
            developer: "👨‍💻 Developer",
            qa: "🧪 QA",
            devops: "⚙️ DevOps",
          };

          let out = "";
          const border = "═════════════════════════════════════════════════";
          out += `╔${border}╗\n`;
          out += `║  🏗️  PIPELINE: ${tpl.toUpperCase()}${" ".repeat(Math.max(0, 34 - tpl.length))}║\n`;
          out += `╚${border}╝\n\n`;
          out += `  📋 Template : ${cfg.description}\n`;
          out += `  🆔 Task ID  : ${taskId}\n`;
          out += `  🔧 Fitur    : ${name}\n\n`;

          out += `  ${"─".repeat(50)}\n`;
          out += `  📊 ALUR PIPELINE:\n`;
          out += `  ${"─".repeat(50)}\n\n`;

          const arrow: Record<string, string> = {
            pm: "→",
            architect: "→",
            developer: "→",
            qa: "",
          };

          for (let i = 0; i < stages.length; i++) {
            const s = stages[i];
            const nextStage = i < stages.length - 1 ? stages[i + 1].from : null;
            out += `  ${i + 1}. ${stageLabels[s.from] || s.from}\n`;
            out += `     ${s.type === "review_request" ? "🔍" : s.type === "approval" ? "👍" : s.type === "clarification" ? "❓" : "💬"} "${s.message}"\n`;
            out += `     📨 → ${stageLabels[s.to] || s.to}\n`;
            if (nextStage) {
              out += `     ${"↓".padStart(6)}\n`;
            }
            out += "\n";
          }

          out += `  ${"─".repeat(50)}\n\n`;

          out += `  ✅ Pipeline selesai! Cek pesan dengan:\n`;
          out += `     inter_agent_inbox role=all\n`;
          out += `     inter_agent_conversation taskId=${taskId}\n\n`;

          log("🏗️", `Pipeline "${tpl}" dijalankan`, { taskId, feature: name, stages: stages.length });

          out += `📁 ${LOG_FILE}\n`;
          return out;
        },
      },

      inter_agent_board: {
        description:
          "📊 Papan status semua agent dan task yang sedang berjalan.",
        parameters: {},
        execute: async () => {
          const messages = readInbox();
          const taskIds = new Set(messages.map((m) => m.taskId || "no-task"));

          let out = "";
          const b = "══════════════════════════════════════════════════════";
          out += `╔${b}╗\n`;
          out += `║  📊  AGENT STATUS BOARD${" ".repeat(37)}║\n`;
          out += `╚${b}╝\n\n`;

          for (const agent of AGENT_ROLES) {
            const agentMsgs = messages.filter((m) => m.from === agent.id || m.to === agent.id);
            const sent = agentMsgs.filter((m) => m.from === agent.id).length;
            const received = agentMsgs.filter((m) => m.to === agent.id).length;
            const unread = agentMsgs.filter((m) => m.to === agent.id && !m.read).length;

            out += `  ${agent.emoji} ${agent.name.padEnd(20)}  📤 ${String(sent).padStart(2)}  📥 ${String(received).padStart(2)}  ${unread > 0 ? `🆕 ${unread} unread` : "✅"}\n`;
          }

          out += `\n  ${"─".repeat(50)}\n`;
          out += `  🆔 Total task: ${taskIds.size}\n`;
          out += `  💬 Total pesan: ${messages.length}\n\n`;

          for (const taskId of taskIds) {
            const taskMsgs = messages.filter((m) => m.taskId === taskId);
            const first = taskMsgs[0];
            const last = taskMsgs[taskMsgs.length - 1];
            const types = taskMsgs.map((m) => m.type);
            const isComplete = types.includes("approval");

            out += `  ${isComplete ? "✅" : "🔄"} ${(taskId.length > 30 ? taskId.substring(0, 27) + "..." : taskId).padEnd(33)} ${taskMsgs.length} msgs\n`;
          }

          out += `\n📁 ${LOG_FILE}\n`;
          return out;
        },
      },
    },
  };
}) satisfies Plugin;
