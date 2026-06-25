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
          try {
            const res = await client.config.providers() as any;
            const providers = res?.data?.providers ?? [];
            let result = "";
            for (const p of providers) {
              if (provider && p.id !== provider) continue;
              for (const [modelId, m] of Object.entries(p.models || {})) {
                result += `${p.id}/${modelId}\n${JSON.stringify(m, null, 2)}\n`;
              }
            }
            return result || "Tidak ada model ditemukan.";
          } catch (e) {
            const err = e as Error;
            return `Gagal mengambil daftar model: ${err.message}`;
          }
        },
      },
    },
  };
}) satisfies Plugin;
