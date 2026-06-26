import type { OpencodeClient } from "@opencode-ai/sdk";

export async function fileRead(client: OpencodeClient) {
  const f = await client.file.read({ query: { path: "src/index.ts" } }) as any;
  console.log("file.type:", f.data?.type);
  console.log("file.mimeType:", f.data?.mimeType);
}

export async function fileStatus(client: OpencodeClient) {
  const s = await client.file.status() as any;
  for (const f of s.data ?? []) {
    console.log(`${f.status}: ${f.path} (+${f.added}/-${f.removed})`);
  }
}

export async function globalHealth(client: OpencodeClient) {
  const h = await (client as any).global.health();
  console.log("health:", h.data?.healthy, "(version:", h.data?.version + ")");
}

export async function appLog(client: OpencodeClient) {
  await client.app.log({
    body: { service: "my-plugin", level: "info", message: "Session started", extra: { sessionId: "abc" } },
  } as any);
  console.log("log: written");
}

export async function appAgents(client: OpencodeClient) {
  const a = await client.app.agents() as any;
  for (const agent of a.data ?? []) {
    console.log(`agent: ${agent.name} — ${agent.description}`);
  }
}

export async function authSet(client: OpencodeClient) {
  await client.auth.set({
    path: { id: "anthropic" },
    body: { type: "api", key: "sk-ant-..." },
  } as any);
  console.log("auth: set");
}
