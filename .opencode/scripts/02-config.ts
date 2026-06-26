import type { OpencodeClient } from "@opencode-ai/sdk";

export async function configGet(client: OpencodeClient) {
  const cfg = await client.config.get() as any;
  console.log("config.model:", cfg.data?.model);
}

export async function configUpdate(client: OpencodeClient) {
  await client.config.update({ body: { model: "openai/gpt-4o" } as any });
  console.log("config.update: done");
}

export async function configProviders(client: OpencodeClient) {
  const raw = await client.config.providers() as any;
  const providers = raw?.data?.providers ?? [];
  const defaults = raw?.data?.default ?? {};
  for (const p of providers) {
    console.log(`provider: ${p.name}`);
    for (const [id, m] of Object.entries(p.models ?? {})) {
      const model = m as any;
      console.log(`  ${id} — ${model.name} (${model.status})`);
    }
  }
  console.log("defaults:", defaults);
}
