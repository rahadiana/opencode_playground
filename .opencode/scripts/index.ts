import { createOpencode } from "@opencode-ai/sdk";
import * as session from "./01-session";
import * as config from "./02-config";
import * as pathVcsFind from "./03-path-vcs-find";
import * as fileGlobalAppAuth from "./04-file-global-app-auth";
import * as tuiPtyEvents from "./05-tui-pty-events";

async function main() {
  const { client, server } = await createOpencode({
    hostname: "127.0.0.1",
    port: 4096,
    config: { model: "anthropic/claude-sonnet-4-20250514" },
  });

  try {
    // ── Session API ──
    const sid = await session.sessionCreate(client);
    await session.sessionList(client);
    await session.sessionGet(client, sid);
    await session.sessionUpdate(client, sid);
    await session.sessionChildren(client, sid);
    await session.sessionAbort(client, sid);
    await session.sessionStatus(client);
    await session.sessionMessages(client, sid);

    // ── Config API ──
    await config.configGet(client);
    await config.configUpdate(client);
    await config.configProviders(client);

    // ── Path / VCS / Find API ──
    await pathVcsFind.pathGet(client);
    await pathVcsFind.vcsGet(client);
    await pathVcsFind.findText(client);
    await pathVcsFind.findFiles(client);

    // ── File / Global / App / Auth API ──
    await fileGlobalAppAuth.fileStatus(client);
    await fileGlobalAppAuth.globalHealth(client);
    await fileGlobalAppAuth.appLog(client);
    await fileGlobalAppAuth.appAgents(client);
    await fileGlobalAppAuth.authSet(client);

    // ── TUI / PTY / Events API ──
    await tuiPtyEvents.tuiShowToast(client);
    await tuiPtyEvents.tuiExecuteCommand(client);
    await tuiPtyEvents.ptyList(client);
    const ptyId = await tuiPtyEvents.ptyCreate(client);
    await tuiPtyEvents.ptyGet(client, ptyId);
    await tuiPtyEvents.ptyRemove(client, ptyId);
    await tuiPtyEvents.eventSubscribe(client);

    // cleanup
    await session.sessionDelete(client, sid);
  } finally {
    server.close();
  }
}

main().catch(console.error);
