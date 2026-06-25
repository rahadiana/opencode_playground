import type { Plugin } from "@opencode-ai/plugin";

export default (async ({ client }) => {
  await client.app.log({
    body: {
      service: "view-models",
      level: "info",
      message: "ViewAllModels plugin initialized",
    },
  });

  return {
    tool: {
      view_all_models: {
        description:
          "Menampilkan semua model yang tersedia dari provider yang sudah terkonfigurasi di opencode.",
        parameters: {
          provider: {
            type: "string",
            description:
              "Filter model berdasarkan provider (contoh: anthropic, openai, openrouter). Kosongkan untuk semua provider.",
          },
          refresh: {
            type: "string",
            enum: ["yes", "no"],
            description:
              '"yes" = refresh cache model dari models.dev (default "no")',
          },
        },
        execute: async ({ provider, refresh }: { provider?: string; refresh?: string }) => {
          const cmdArgs = ["models"];
          if (provider) cmdArgs.push(provider);
          if (refresh === "yes") cmdArgs.push("--refresh");
          if (!provider) cmdArgs.push("--verbose");

          try {
            const proc = Bun.spawnSync(["/usr/local/bin/opencode", ...cmdArgs]);
            if (proc.exitCode !== 0) {
              const stderr = proc.stderr.toString().trim();
              return `Gagal mengambil daftar model: ${stderr || `exit code ${proc.exitCode}`}`;
            }
            return proc.stdout.toString();
          } catch (e) {
            const err = e as Error;
            return `Gagal mengambil daftar model: ${err.message}`;
          }
        },
      },
    },
  };
}) satisfies Plugin;
