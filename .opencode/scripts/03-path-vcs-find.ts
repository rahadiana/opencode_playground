import type { OpencodeClient } from "@opencode-ai/sdk";

export async function pathGet(client: OpencodeClient) {
  const p = await client.path.get() as any;
  console.log("path.worktree:", p.data?.worktree);
  console.log("path.state:", p.data?.state);
  console.log("path.config:", p.data?.config);
  console.log("path.directory:", p.data?.directory);
}

export async function vcsGet(client: OpencodeClient) {
  const v = await client.vcs.get() as any;
  console.log("vcs.branch:", v.data?.branch);
}

export async function findText(client: OpencodeClient) {
  const r = await client.find.text({ query: { pattern: "TODO|FIXME" } }) as any;
  for (const m of r.data ?? []) {
    console.log(`${m.path.text}:${m.line_number} ${m.lines.text}`);
  }
}

export async function findFiles(client: OpencodeClient) {
  const f = await client.find.files({ query: { query: "*.ts", type: "file" } } as any) as any;
  console.log("files:", f.data);
}

export async function findSymbols(client: OpencodeClient) {
  const s = await client.find.symbols({ query: { query: "hello" } }) as any;
  for (const sym of s.data ?? []) {
    console.log(`symbol: ${sym.name} (kind=${sym.kind}) at ${sym.location.uri}`);
  }
}
