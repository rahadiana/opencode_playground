import { tool } from "@opencode-ai/plugin";
export const ViewModels = async ({ client }) => {
    return {
        tool: {
            view_all_models: tool({
                description: "Daftar semua model yang tersedia dari semua provider.",
                args: {},
                async execute() {
                    const raw = await client.config.providers();
                    const providers = raw?.data?.providers ?? [];
                    const lines = [];
                    for (const p of providers) {
                        for (const [id, m] of Object.entries(p.models ?? {})) {
                            const model = m;
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
