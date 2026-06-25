import type { Plugin } from "@opencode-ai/plugin";

export default (async ({ client }) => {
  return {
    tool: {
      context: {
        description: "Menampilkan pemakaian context session saat ini: total tokens, persentase, dan biaya.",
        parameters: {},
        execute: async () => {
          try {
            const sessions = await client.session.list() as any;
            const list = sessions?.data ?? [];
            if (!list.length) return "Tidak ada session aktif.";
            const ses = list[list.length - 1];
            const msgs = await client.session.messages({ path: { id: ses.id } }) as any;
            const parts = msgs?.data ?? [];
            let totalTokens = 0;
            let totalCost = 0;
            let modelId = "";
            let providerId = "";
            for (const msg of parts) {
              const info = msg?.info;
              if (info?.role === "assistant") {
                totalTokens += info.tokens?.input ?? 0;
                totalTokens += info.tokens?.output ?? 0;
                totalCost += info.cost ?? 0;
                if (!modelId) modelId = info.modelID ?? "";
                if (!providerId) providerId = info.providerID ?? "";
              }
            }
            return JSON.stringify({
              session: ses.title || ses.id,
              model: `${providerId}/${modelId}`,
              tokens: totalTokens,
              cost: totalCost,
            }, null, 2);
          } catch (e) {
            const err = e as Error;
            return `Gagal: ${err.message}`;
          }
        },
      },
    },
  };
}) satisfies Plugin;
