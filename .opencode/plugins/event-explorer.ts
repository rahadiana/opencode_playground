import type { Plugin } from "@opencode-ai/plugin";
import * as fs from "fs";
import * as path from "path";

/**
 * Event Explorer Plugin
 * -----------------------
 * Plugin ini mendemonstrasikan bagaimana opencode events bekerja.
 * Semua log ditulis ke FILE (bukan console.log) agar mudah dilihat
 * di opencode CLI.
 *
 * 🔍 Model Tracker: menyimpan model apa yang dipakai setiap kali
 * prompt dikirim, termasuk provider-nya.
 */

// File log location — di .opencode/ biar rapi
const LOG_DIR = path.join(process.cwd() || ".", ".opencode");
const LOG_FILE = path.join(LOG_DIR, "event-explorer.log");
const MODEL_LOG_FILE = path.join(LOG_DIR, "model-history.log");

// Pastikan folder .opencode/ ada
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Append text ke file log.
 */
function writeLog(filePath: string, text: string) {
  try {
    fs.appendFileSync(filePath, text, "utf-8");
  } catch {
    // silent fail — jangan sampai plugin ngebreak opencode
  }
}

/**
 * Tulis log event + timestamp ke file utama.
 */
function logToFile(emoji: string, msg: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  let line = `[${timestamp}] ${emoji} ${msg}`;
  if (data) {
    line += `\n${JSON.stringify(data, null, 2)}`;
  }
  line += "\n";
  writeLog(LOG_FILE, line);
}

/**
 * Tulis banner besar ke file.
 */
function bannerToFile(lines: string[]) {
  const timestamp = new Date().toISOString();
  const border = "═".repeat(60);
  const content = [
    `\n`,
    `  ╔${border}╗  [${timestamp}]\n`,
    ...lines.map((l) => `  ║  ${l.padEnd(56)}║\n`),
    `  ╚${border}╝\n`,
    `\n`,
  ].join("");
  writeLog(LOG_FILE, content);
}

export default (async ({ client, project, directory, $ }) => {
  // --- State untuk custom tool events_status ---
  const eventCounts: Record<string, number> = {};
  const eventLog: Array<{ event: string; time: string; data?: unknown }> = [];

  // --- Model tracking ---
  let configuredModel: string | null = null;
  let lastUsedModel: string | null = null;
  let modelHistory: Array<{
    model: string;
    timestamp: string;
    temperature?: number;
    maxTokens?: number;
  }> = [];

  function track(eventName: string, data?: unknown) {
    eventCounts[eventName] = (eventCounts[eventName] || 0) + 1;
    eventLog.push({ event: eventName, time: new Date().toISOString(), data });
  }

  /**
   * Cari model dari objek sedalam mungkin.
   * Parameter LLM bisa bersarang di berbagai level.
   */
  function extractModel(obj: unknown): string | null {
    if (!obj || typeof obj !== "object") return null;
    const record = obj as Record<string, unknown>;

    // Langsung
    if (typeof record.model === "string") return record.model;

    // Di dalam options
    if (record.options && typeof record.options === "object") {
      const opts = record.options as Record<string, unknown>;
      if (typeof opts.model === "string") return opts.model;
    }

    // Cari key "model" di semua level 1
    for (const [key, val] of Object.entries(record)) {
      if (key.toLowerCase().includes("model") && typeof val === "string") {
        return val;
      }
      if (val && typeof val === "object") {
        const nested = val as Record<string, unknown>;
        for (const [k2, v2] of Object.entries(nested)) {
          if (k2.toLowerCase().includes("model") && typeof v2 === "string") {
            return v2;
          }
        }
      }
    }
    return null;
  }

  // Tulis header file log
  logToFile("🚀", "EVENT EXPLORER STARTED");
  logToFile("📁", `Log file: ${LOG_FILE}`);
  logToFile("📁", `Model history: ${MODEL_LOG_FILE}`);
  logToFile("📁", `Project: ${project ?? "unknown"}`);
  logToFile("📁", `Directory: ${directory ?? "unknown"}`);

  return {
    // ==========================================
    // 1. CONFIG — dipanggil sekali saat init
    // ==========================================
    config: (cfg) => {
      configuredModel = cfg.model ?? null;
      track("config");

      // Banner besar untuk configured model (ke FILE)
      const text = configuredModel
        ? `🎯  Configured Model: ${configuredModel}`
        : "⚠️  No model configured in opencode.json";
      const bannerLines = [
        "🔧 EVENT EXPLORER — ACTIVE",
        text,
        ...(cfg.small_model ? [`Small model: ${cfg.small_model}`] : []),
      ];
      bannerToFile(bannerLines);

      logToFile("📋", `Username: ${cfg.username ?? "(not set)"}`);
      logToFile("📦", `Plugins terdaftar: ${(cfg.plugin ?? []).length} entries`);

      // Tulis juga file terpisah untuk model history header
      writeLog(
        MODEL_LOG_FILE,
        `=== MODEL HISTORY ===\nStarted: ${new Date().toISOString()}\nConfigured: ${cfg.model ?? "default"}\n${"=".repeat(60)}\n\n`
      );
    },

    // ==========================================
    // 2. TOOL EXECUTION — sebelum & sesudah
    // ==========================================
    "tool.execute.before": async (input, output) => {
      // input = { tool, sessionID, callID }, NOT { name }
      const inp = input as Record<string, unknown>;
      const out = output as Record<string, unknown>;
      const toolName = (inp.tool as string) ?? "???";
      track("tool.execute.before", { name: toolName });

      logToFile("⚡", `BEFORE: "${toolName}"`, {
        args: out.args,
        sessionID: inp.sessionID,
      });
    },

    "tool.execute.after": async (input, output) => {
      const inp = input as Record<string, unknown>;
      const out = output as Record<string, unknown>;
      const toolName = (inp.tool as string) ?? "???";
      const status = out.error ? "❌ ERROR" : "✅ SUCCESS";
      track("tool.execute.after", { name: toolName, status: out.error ? "error" : "success" });

      logToFile(status as "❌ ERROR" | "✅ SUCCESS", `AFTER: "${toolName}"`, {
        duration: out.durationMs ? `${out.durationMs}ms` : "unknown",
        resultTruncated: out.result
          ? out.result.toString().substring(0, 200)
          : "(no result)",
        error: out.error ?? undefined,
      });
    },

    // ==========================================
    // 3. TOOL DEFINITION — saat tool didaftarkan
    // ==========================================
    "tool.definition": async (input, output) => {
      // Struktur: ada name di definition output?
      const inp = input as Record<string, unknown>;
      const out = output as Record<string, unknown>;
      const toolName = (out.name as string) ?? (inp.name as string) ?? "???";
      track("tool.definition", { name: toolName });
      logToFile("🛠️", `Tool definition registered: "${toolName}"`);
    },

    // ==========================================
    // 4. CHAT — message & params ke LLM
    // ==========================================
    "chat.message": async (input, output) => {
      track("chat.message");
      const inp = input as Record<string, unknown>;
      const out = output as Record<string, unknown> | undefined;

      // Model dari input
      const mdl = inp.model as Record<string, unknown> | undefined;
      const modelStr = mdl?.providerID && mdl?.id
        ? `${mdl.providerID}/${mdl.id}`
        : "?";

      const role = (out?.role as string) ?? "unknown";
      const contentPreview = out?.content
        ? (out.content as string).substring(0, 100)
        : "(empty)";
      logToFile("💬", `Chat message [${role}] (${modelStr}): "${contentPreview}..."`);
    },

    "chat.params": async (input, output) => {
      track("chat.params");

      // ✅ Model ADA di input, bukan output!
      // input = { sessionID, agent, model, provider, message }
      // output = { temperature, topP, topK, maxOutputTokens, options }
      const inp = input as Record<string, unknown>;
      const out = output as Record<string, unknown>;
      const temp = out?.temperature as number | undefined;
      const maxTokens = out?.maxOutputTokens as number | undefined;

      // Ambil model dari input
      // Struktur: input.model = { providerID, id, name, family, ... }
      const mdl = inp.model as Record<string, unknown> | undefined;
      const providerID = mdl?.providerID as string | undefined;
      const modelID = mdl?.id as string | undefined;

      let modelStr: string | null = null;
      if (providerID && modelID) {
        modelStr = `${providerID}/${modelID}`;
      }

      if (modelStr) {
        lastUsedModel = modelStr;
        const timestamp = new Date().toISOString();
        modelHistory.push({
          model: modelStr,
          timestamp,
          temperature: temp,
          maxTokens,
        });

        // Banner setiap prompt
        bannerToFile([
          `🚀 PROMPT SENT — ${timestamp}`,
          `Model: ${modelStr}`,
          `Provider: ${providerID}  |  ID: ${modelID}  |  Agent: ${(inp.agent as string) ?? "default"}  |  Temp: ${temp ?? "default"}`,
        ]);

        writeLog(
          MODEL_LOG_FILE,
          `[${timestamp}] Model: ${modelStr} | Agent: ${(inp.agent as string) ?? "?"} | Temp: ${temp ?? "-"} | MaxTokens: ${maxTokens ?? "-"}\n`
        );
      } else {
        logToFile("🧠", "LLM Params — model tidak ditemukan di input", {
          modelRaw: mdl,
          inputKeys: Object.keys(inp),
        });
      }

      logToFile("🧠", `LLM Params: temp=${temp}, maxTokens=${maxTokens}`, {
        model: modelStr ?? configuredModel ?? "?",
        agent: inp.agent,
        options: out?.options ?? {},
      });
    },

    "chat.headers": async (input, output) => {
      track("chat.headers");

      // input juga punya model!
      const inp = input as Record<string, unknown>;
      const mdl = inp.model as Record<string, unknown> | undefined;
      const modelStr = mdl?.providerID && mdl?.id
        ? `${mdl.providerID}/${mdl.id}`
        : null;

      const headers = output as Record<string, string> | undefined;
      if (headers) {
        logToFile("📨", "Chat request headers (FULL)", headers as Record<string, unknown>);
        const relevantHeaders = [
          "x-model",
          "x-request-id",
          "content-type",
          "authorization",
          "anthropic-version",
          "openai-beta",
        ];
        const found: Record<string, string> = {};
        for (const h of relevantHeaders) {
          const val = headers[h] ?? headers[h.toLowerCase()];
          if (val) {
            found[h] =
              h === "authorization" ? `${val.substring(0, 15)}...` : val;
          }
        }
        if (Object.keys(found).length > 0) {
          logToFile("📨", "Chat request headers (relevan)", found);
        }
      }

      if (modelStr) {
        logToFile("📨", `Request model: ${modelStr}`);
      }
    },

    // ==========================================
    // 5. PERMISSION — saat user dimintai izin
    // ==========================================
    "permission.ask": async (input, output) => {
      track("permission.ask");
      logToFile("🔐", `Permission asked: "${input?.action ?? "unknown action"}"`, {
        tool: input?.tool,
        args: input?.args,
      });
    },

    // ==========================================
    // 6. SHELL ENV — environment variables
    // ==========================================
    "shell.env": async (input, output) => {
      track("shell.env");
      const envKeys = Object.keys(output ?? {}).slice(0, 10);
      logToFile(
        "🌐",
        `Shell env dimuat (${Object.keys(output ?? {}).length} vars)`,
        { sample: envKeys }
      );
    },

    // ==========================================
    // 7. COMMAND EXECUTION
    // ==========================================
    "command.execute.before": async (input, output) => {
      track("command.execute.before");
      logToFile("📟", `Custom command dijalankan: "${input?.name ?? "unknown"}"`);
    },

    // ==========================================
    // 8. CUSTOM TOOLS
    // ==========================================
    tool: {
      // -------------------------------------------
      // Tool #1: Lihat model yang sedang aktif
      // -------------------------------------------
      current_model: {
        description:
          "Menampilkan model LLM yang sedang digunakan oleh opencode saat ini. Meliputi model dari config, model terakhir yang dipakai, dan riwayat model.",
        parameters: {
          history: {
            type: "string",
            enum: ["yes", "no"],
            description:
              '"yes" = tampilkan riwayat model (default), "no" = hanya model aktif sekarang',
          },
        },
        execute: async ({ history }: { history?: string }) => {
          let output = "";

          const border = "═══════════════════════════════════════════════";
          output += `╔${border}╗\n`;
          output += `║  🎯  MODEL LLM YANG SEDANG AKTIF              ║\n`;
          output += `╚${border}╝\n\n`;

          output += `📋 Model dari config opencode.json:\n`;
          output += `   ${configuredModel ?? "⚠️  Tidak ada (default provider akan dipakai)"}\n\n`;

          output += `🔄 Model terakhir dipakai:\n`;
          output += `   ${lastUsedModel ?? "⏳ Belum ada prompt yang dikirim"}\n\n`;

          if (lastUsedModel && lastUsedModel.includes("/")) {
            const [provider, ...rest] = lastUsedModel.split("/");
            output += `📊 Informasi provider:\n`;
            output += `   Provider : ${provider}\n`;
            output += `   Model    : ${rest.join("/")}\n`;
            output += `   Format   : provider/model-id\n\n`;
          }

          if (history !== "no" && modelHistory.length > 0) {
            output += `📜 Riwayat model (${modelHistory.length} prompt):\n`;
            output += `   ${"#".padEnd(3)} ${"Waktu".padEnd(24)} ${"Model".padEnd(30)} ${"Temp".padEnd(6)}\n`;
            output += `   ${"-".repeat(3)} ${"-".repeat(24)} ${"-".repeat(30)} ${"-".repeat(6)}\n`;
            modelHistory.forEach((entry, i) => {
              output += `   ${(i + 1).toString().padEnd(3)} ${entry.timestamp.padEnd(24)} ${entry.model.padEnd(30)} ${(entry.temperature?.toString() ?? "-").padEnd(6)}\n`;
            });
          } else if (modelHistory.length === 0) {
            output += `📜 Riwayat model: (kosong — belum ada prompt)\n`;
          }

          output += `\n💡 Tips:\n`;
          output += `   • Model di-set di opencode.json → field "model"\n`;
          output += `   • Bisa juga di-set per-agent → "agent.{name}.model"\n`;
          output += `   • Format: "provider/model-id" (contoh: "anthropic/claude-sonnet-4-6")\n`;
          output += `   • "small_model" dipakai untuk task ringan\n`;

          output += `\n📁 File log: ${LOG_FILE}\n`;
          output += `📁 Model history: ${MODEL_LOG_FILE}\n`;

          return output;
        },
      },

      // -------------------------------------------
      // Tool #2: Statistik semua event
      // -------------------------------------------
      events_status: {
        description:
          "Menampilkan ringkasan semua event yang telah ditangkap oleh Event Explorer plugin. Gunakan untuk melihat event apa saja yang sudah terjadi selama sesi ini.",
        parameters: {
          detail: {
            type: "string",
            enum: ["summary", "full"],
            description:
              '"summary" = hitungan per event (default), "full" = termasuk log detail',
          },
          file: {
            type: "string",
            enum: ["yes", "no"],
            description:
              '"yes" = tulis output juga ke file (default), "no" = tampilkan saja',
          },
        },
        execute: async ({
          detail,
          file,
        }: { detail?: string; file?: string }) => {
          const isFull = detail === "full";
          const toFile = file !== "no";

          let output = `📊 EVENT EXPLORER — STATISTIK\n`;
          output += `══════════════════════════════\n`;
          output += `Total event tertangkap: ${eventLog.length}\n\n`;

          // Tampilkan model status
          output += `🎯 Model aktif: ${lastUsedModel ?? configuredModel ?? "belum diketahui"}\n\n`;

          // Group by event type
          const sortedEvents = Object.entries(eventCounts).sort(
            ([, a], [, b]) => b - a
          );
          output += `📋 Per-event count:\n`;
          for (const [event, count] of sortedEvents) {
            output += `   ${event.padEnd(30)} ${count}x\n`;
          }

          if (isFull && eventLog.length > 0) {
            output += `\n📜 Detail log (${eventLog.length} entries):\n`;
            eventLog.forEach((entry, i) => {
              output += `   ${i + 1}. [${entry.time}] ${entry.event}\n`;
            });
          }

          output += `\n💡 Tips:\n`;
          output += `   • "current_model" — info model detail\n`;
          output += `   • "events_status detail=full" — semua log detail\n`;
          output += `   📁 ${LOG_FILE} — file log utama\n`;
          output += `   📁 ${MODEL_LOG_FILE} — riwayat model\n`;

          // Tulis ke file juga jika diminta
          if (toFile) {
            logToFile("📊", "STATISTIK DIMINTA", {
              totalEvents: eventLog.length,
              perEvent: Object.fromEntries(sortedEvents),
            });
            output += `\n✅ Statistik juga ditulis ke ${LOG_FILE}`;
          }

          return output;
        },
      },
    },
  };
}) satisfies Plugin;
