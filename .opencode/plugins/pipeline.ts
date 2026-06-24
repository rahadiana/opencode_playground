import type { Plugin } from "@opencode-ai/plugin";
import * as fs from "fs";
import * as path from "path";

const DIR = path.join(process.cwd() || ".", ".opencode");
const LOG = path.join(DIR, "pipeline.log");
const DATA = path.join(DIR, "pipeline-data.json");

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

function log(text: string) {
  try { fs.appendFileSync(LOG, text, "utf-8"); } catch { /* silent */ }
}
function readData(): Record<string, unknown>[] {
  try { return JSON.parse(fs.readFileSync(DATA, "utf-8")); } catch { return []; }
}
function saveData(d: unknown[]) {
  fs.writeFileSync(DATA, JSON.stringify(d, null, 2), "utf-8");
}

const LABELS: Record<string, string> = {
  pm: "👔 PM", architect: "🏗️ Architect", developer: "👨‍💻 Developer", qa: "🧪 QA", devops: "⚙️ DevOps",
};

export default (() => {
  log("🏗️ PIPELINE PLUGIN STARTED\n");

  return {
    tool: {
      inter_agent_pipeline: {
        description: "🏗️ Pipeline multi-agent: PM→Architect→Developer→QA.",
        parameters: {
          template: { type: "string", enum: ["feature", "bugfix", "review"], description: "Template" },
          featureName: { type: "string", description: "Nama fitur/bug" },
        },
        execute: async ({ template, featureName }: { template?: string; featureName?: string }) => {
          const tpl = template || "feature";
          const name = featureName || "fitur-demo";
          const taskId = `pipe-${tpl}-${Date.now()}`;

          const stages: Record<string, { from: string; to: string; type: string; message: string }[]> = {
            feature: [
              { from: "pm", to: "architect", type: "result", message: `Desain arsitektur untuk: "${name}"` },
              { from: "architect", to: "developer", type: "result", message: `Implementasi: komponen + unit test untuk "${name}"` },
              { from: "developer", to: "qa", type: "review_request", message: `"${name}" selesai. Mohon direview.` },
              { from: "qa", to: "developer", type: "approval", message: `"${name}" siap deploy. 👍` },
            ],
            bugfix: [
              { from: "pm", to: "developer", type: "result", message: `Bug pada "${name}". Tolong diperbaiki.` },
              { from: "developer", to: "qa", type: "review_request", message: `Fix "${name}" siap diuji.` },
              { from: "qa", to: "developer", type: "approval", message: `Bug "${name}" terverifikasi. 👍` },
            ],
            review: [
              { from: "developer", to: "qa", type: "review_request", message: `Code review: "${name}"` },
              { from: "qa", to: "developer", type: "review_response", message: `Refactor fungsi X, tambah error handling.` },
              { from: "developer", to: "qa", type: "result", message: `Sudah diperbaiki.` },
              { from: "qa", to: "developer", type: "approval", message: `LGTM! ✅` },
            ],
          };

          const msgs = stages[tpl].map((s) => ({
            ...s,
            time: new Date().toISOString(),
            taskId,
            read: false,
          }));
          const all = readData();
          all.push(...msgs);
          saveData(all);
          log(`🏗️ Pipeline ${tpl} "${name}" (${taskId})\n`);

          let out = `╔═════════════════════════════════════════════════════╗\n║  🏗️  PIPELINE: ${tpl.toUpperCase()}${" ".repeat(30 - tpl.length)}║\n╚═════════════════════════════════════════════════════╝\n\n`;
          out += `📋 ${tpl === "feature" ? "PM→Architect→Developer→QA" : tpl === "bugfix" ? "PM→Developer→QA" : "Developer→QA"}\n`;
          out += `🆔 ${taskId}\n🔧 ${name}\n\n`;
          for (let i = 0; i < msgs.length; i++) {
            const m = msgs[i];
            out += `  ${i + 1}. ${LABELS[m.from] || m.from}\n     💬 "${m.message}"\n     📨 → ${LABELS[m.to] || m.to}\n\n`;
          }
          out += `✅ Selesai! Lihat: inter_agent_conversation taskId=${taskId}\n📁 ${LOG}\n`;
          return out;
        },
      },
    },
  };
}) satisfies Plugin;
