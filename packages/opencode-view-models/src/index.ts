import { type Plugin, tool } from "@opencode-ai/plugin";

export const ViewModels: Plugin = async ({ client }) => {
  return {
    tool: {
      view_all_models: tool({
        description: "Daftar semua model yang tersedia dari semua provider.",
        args: {},
        async execute() {
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
      }),
    },
  };
};
