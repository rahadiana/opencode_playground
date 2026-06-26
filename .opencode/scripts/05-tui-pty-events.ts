import type { OpencodeClient } from "@opencode-ai/sdk";

export async function tuiAppendPrompt(client: OpencodeClient) {
  await (client as any).tui.appendPrompt({ body: { text: "Add this to prompt" } });
  console.log("tui.appendPrompt: done");
}

export async function tuiClearPrompt(client: OpencodeClient) {
  await (client as any).tui.clearPrompt();
  console.log("tui.clearPrompt: done");
}

export async function tuiSubmitPrompt(client: OpencodeClient) {
  await (client as any).tui.submitPrompt();
  console.log("tui.submitPrompt: done");
}

export async function tuiShowToast(client: OpencodeClient) {
  await (client as any).tui.showToast({ body: { message: "Task completed", variant: "success" } });
  console.log("tui.showToast: done");
}

export async function tuiExecuteCommand(client: OpencodeClient) {
  await (client as any).tui.executeCommand({ body: { command: "agent.cycle" } });
  console.log("tui.executeCommand: done");
}

export async function tuiOpenDialogs(client: OpencodeClient) {
  await (client as any).tui.openHelp();
  await (client as any).tui.openSessions();
  await (client as any).tui.openThemes();
  await (client as any).tui.openModels();
  console.log("tui.openDialogs: done");
}

export async function ptyList(client: OpencodeClient) {
  const p = await client.pty.list() as any;
  for (const pt of p.data ?? []) console.log(`pty: ${pt.title} (${pt.status})`);
}

export async function ptyCreate(client: OpencodeClient) {
  const p = await client.pty.create({ body: { command: "tail", args: ["-f", "/var/log/syslog"] } }) as any;
  console.log("pty.create:", p.data?.id);
  return p.data?.id;
}

export async function ptyGet(client: OpencodeClient, id: string) {
  const p = await client.pty.get({ path: { id } }) as any;
  console.log("pty.get:", p.data?.title, p.data?.status);
}

export async function ptyUpdate(client: OpencodeClient, id: string) {
  await client.pty.update({ path: { id }, body: { title: "renamed" } });
  console.log("pty.update: done");
}

export async function ptyRemove(client: OpencodeClient, id: string) {
  await client.pty.remove({ path: { id } });
  console.log("pty.remove: done");
}

export async function ptyConnect(client: OpencodeClient, id: string) {
  await client.pty.connect({ path: { id } });
  console.log("pty.connect: done");
}

export async function eventSubscribe(client: OpencodeClient) {
  const events = await client.event.subscribe() as any;
  for await (const evt of events.stream) {
    console.log("event:", evt.type, evt.properties);
    break;
  }
}
