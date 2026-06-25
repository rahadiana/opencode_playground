import type { Plugin } from "@opencode-ai/plugin";

export const ViewAllModels: Plugin = async ({ client }) => {
  return {
    tool: {
      view_all_models: {
        description: "List all available models from all providers.",
        parameters: {},
        execute: async () => {
          const raw = await client.config.providers() as any;
          const providers = raw?.data?.providers ?? [];
          const lines: string[] = [];
          for (const p of providers) {
            for (const [id, m] of Object.entries(p.models ?? {})) {
              const model = m as any;
              lines.push(`${p.id}/${id}`);
              lines.push(JSON.stringify(model, null, 2));
            }
          }
          return lines.join("\n");
        },
      },
    },
  };
};
