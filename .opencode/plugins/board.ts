import type { Plugin } from "@opencode-ai/plugin";
import * as fs from "fs";
import * as path from "path";

const DIR = path.join(process.cwd() || ".", ".opencode");
const LOG = path.join(DIR, "board.log");

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

function log(text: string) {
  try { fs.appendFileSync(LOG, text, "utf-8"); } catch { /* silent */ }
}

const AGENTS = [
  { id: "pm", name: "Project Manager", emoji: "👔" },
  { id: "architect", name: "Architect", emoji: "🏗️" },
  { id: "developer", name: "Developer", emoji: "👨‍💻" },
  { id: "qa", name: "QA Engineer", emoji: "🧪" },
  { id: "devops", name: "DevOps", emoji: "⚙️" },
];

function collectMessages(): Array<Record<string, unknown>> {
  const inboxFiles = [".opencode/messaging-inbox.json", ".opencode/pipeline-data.json", ".opencode/debat-inbox.json", ".opencode/inbox.json"];
  const all: Array<Record<string, unknown>> = [];
  for (const f of inboxFiles) {
    try { all.push(...JSON.parse(fs.readFileSync(f, "utf-8"))); } catch { /* skip */ }
  }
  return all;
}

export default (() => {
  log("📊 BOARD PLUGIN STARTED\n");

  return {
    tool: {
      inter_agent_board: {
        description: "📊 Papan status semua agent dan task.",
        parameters: {},
        execute: async () => {
          const messages = collectMessages();
          const taskIds = new Set(messages.map((m) => (m.taskId as string) || "?"));
          let out = `╔══════════════════════════════════════════════════════╗\n║  📊  AGENT STATUS BOARD${" ".repeat(30)}║\n╚══════════════════════════════════════════════════════╝\n\n`;
          for (const a of AGENTS) {
            const ms = messages.filter((m) => m.from === a.id || m.to === a.id);
            const sent = ms.filter((m) => m.from === a.id).length;
            const recv = ms.filter((m) => m.to === a.id).length;
            const unread = ms.filter((m) => m.to === a.id && !m.read).length;
            out += `  ${a.emoji} ${a.name.padEnd(18)} 📤 ${String(sent).padStart(2)} 📥 ${String(recv).padStart(2)} ${unread > 0 ? `🆕 ${unread}` : "✅"}\n`;
          }
          out += `\n  ${"─".repeat(45)}\n  🆔 Total: ${taskIds.size} task | 💬 ${messages.length} pesan\n\n`;
          for (const tid of taskIds) {
            const ms = messages.filter((m) => m.taskId === tid);
            const types = ms.map((m) => m.type as string);
            out += `  ${types.includes("approval") ? "✅" : "🔄"} ${tid.substring(0, 35).padEnd(35)} ${ms.length} msg\n`;
          }
          out += `\n📁 ${LOG}\n`;
          return out;
        },
      },
    },
  };
}) satisfies Plugin;
