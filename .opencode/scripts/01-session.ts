import type { OpencodeClient } from "@opencode-ai/sdk";

const SID = "ses_xyz";

export async function sessionCreate(client: OpencodeClient) {
  const s = await client.session.create({ body: { title: "My session" } });
  console.log("create:", s.data?.id);
  return s.data?.id;
}

export async function sessionList(client: OpencodeClient) {
  const s = await client.session.list();
  console.log("list:", s.data?.length ?? 0, "sessions");
}

export async function sessionGet(client: OpencodeClient, id: string = SID) {
  const s = await client.session.get({ path: { id } });
  console.log("get:", s.data?.title);
}

export async function sessionUpdate(client: OpencodeClient, id: string = SID) {
  const s = await client.session.update({ path: { id }, body: { title: "Updated title" } });
  console.log("update: version", s.data?.version);
}

export async function sessionDelete(client: OpencodeClient, id: string = SID) {
  const ok = await client.session.delete({ path: { id } });
  console.log("delete:", ok);
}

export async function sessionChildren(client: OpencodeClient, id: string = SID) {
  const c = await client.session.children({ path: { id } });
  console.log("children:", c.data?.length);
}

export async function sessionInit(client: OpencodeClient, id: string = SID) {
  await client.session.init({
    path: { id },
    body: { modelID: "claude-sonnet-4-20250514", providerID: "anthropic", messageID: "msg_abc123" },
  });
  console.log("init: done");
}

export async function sessionAbort(client: OpencodeClient, id: string = SID) {
  await client.session.abort({ path: { id } });
  console.log("abort: done");
}

export async function sessionShare(client: OpencodeClient, id: string = SID) {
  const s = await client.session.share({ path: { id } });
  console.log("share:", s.data?.share?.url);
}

export async function sessionUnshare(client: OpencodeClient, id: string = SID) {
  const s = await client.session.unshare({ path: { id } });
  console.log("unshare: version", s.data?.version);
}

export async function sessionSummarize(client: OpencodeClient, id: string = SID) {
  await client.session.summarize({
    path: { id },
    body: { providerID: "anthropic", modelID: "claude-sonnet-4-20250514" },
  });
  console.log("summarize: done");
}

export async function sessionPrompt(client: OpencodeClient, id: string = SID) {
  const r = await client.session.prompt({
    path: { id },
    body: { parts: [{ type: "text" as const, text: "Hello!" }] },
  });
  console.log("prompt: tokens", (r.data as any)?.info?.tokens?.input);
}

export async function sessionPromptNoReply(client: OpencodeClient, id: string = SID) {
  const r = await client.session.prompt({
    path: { id },
    body: { noReply: true, parts: [{ type: "text" as const, text: "Context for next turn." }] },
  });
  console.log("prompt-noReply: role", (r.data as any)?.info?.role);
}

export async function sessionPromptStructured(client: OpencodeClient, id: string = SID) {
  const r = await client.session.prompt({
    path: { id },
    body: {
      parts: [{ type: "text" as const, text: "Extract company info" }],
      format: { type: "json_schema" as const, schema: { type: "object" as const, properties: { name: { type: "string" } }, required: ["name"] } },
    } as any,
  });
  console.log("prompt-structured:", (r.data as any)?.info?.structured_output);
}

export async function sessionCommand(client: OpencodeClient, id: string = SID) {
  const r = await client.session.command({
    path: { id },
    body: { command: "explain", arguments: "DI pattern" },
  });
  console.log("command: cost", (r.data as any)?.info?.cost);
}

export async function sessionShell(client: OpencodeClient, id: string = SID) {
  const r = await client.session.shell({ path: { id }, body: { command: "npm test", agent: "build" } });
  console.log("shell: done", r);
}

export async function sessionStatus(client: OpencodeClient) {
  const s = await client.session.status();
  for (const [id, st] of Object.entries(s.data ?? {})) {
    console.log(`status: ${id} — ${(st as any).type}`);
  }
}

export async function sessionMessages(client: OpencodeClient, id: string = SID) {
  const m = await client.session.messages({ path: { id } });
  for (const msg of m.data ?? []) console.log(`message: ${msg.info.role} — ${msg.info.id}`);
}

export async function sessionMessage(client: OpencodeClient, id: string = SID, messageID: string = "msg_001") {
  const msg = await client.session.message({ path: { id, messageID } });
  console.log("message:", msg.data?.info?.role);
}

export async function sessionRevert(client: OpencodeClient, id: string = SID) {
  const r = await client.session.revert({ path: { id }, body: { messageID: "msg_bad" } });
  console.log("revert:", r.data?.revert?.messageID);
}

export async function sessionUnrevert(client: OpencodeClient, id: string = SID) {
  const r = await client.session.unrevert({ path: { id } });
  console.log("unrevert: updated", r.data?.time?.updated);
}

export async function sessionTodo(client: OpencodeClient, id: string = SID) {
  const t = await client.session.todo({ path: { id } });
  for (const todo of t.data ?? []) console.log(`todo: [${todo.status}] ${todo.content}`);
}

export async function sessionPermission(client: OpencodeClient, id: string = SID, permID: string = "perm_001") {
  await client.postSessionIdPermissionsPermissionId({
    path: { id, permissionID: permID },
    body: { response: "once" },
  });
  console.log("permission: responded once");
}
