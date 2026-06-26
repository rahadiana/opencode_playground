// Event types reference — based on Events Reference section of SDK-REFERENCE.md
// These are the discriminated union members of the `Event` type.

export interface EventServerInstanceDisposed {
  type: "server.instance.disposed";
  properties: { directory: string };
}

export interface EventInstallationUpdated {
  type: "installation.updated";
  properties: { version: string };
}

export interface EventInstallationUpdateAvailable {
  type: "installation.update-available";
  properties: { version: string };
}

export interface EventLspClientDiagnostics {
  type: "lsp.client.diagnostics";
  properties: { serverID: string; path: string };
}

export interface EventLspUpdated {
  type: "lsp.updated";
  properties: { [key: string]: unknown };
}

export interface EventMessageUpdated {
  type: "message.updated";
  properties: { info: any };
}

export interface EventMessageRemoved {
  type: "message.removed";
  properties: { sessionID: string; messageID: string };
}

export interface EventMessagePartUpdated {
  type: "message.part.updated";
  properties: { part: any; delta?: string };
}

export interface EventMessagePartRemoved {
  type: "message.part.removed";
  properties: { sessionID: string; messageID: string; partID: string };
}

export interface EventPermissionUpdated {
  type: "permission.updated";
  properties: any; // Permission
}

export interface EventPermissionReplied {
  type: "permission.replied";
  properties: { sessionID: string; permissionID: string; response: string };
}

export interface EventSessionStatus {
  type: "session.status";
  properties: { sessionID: string; status: any };
}

export interface EventSessionIdle {
  type: "session.idle";
  properties: { sessionID: string };
}

export interface EventSessionCompacted {
  type: "session.compacted";
  properties: { sessionID: string };
}

export interface EventFileEdited {
  type: "file.edited";
  properties: { file: string };
}

export interface EventTodoUpdated {
  type: "todo.updated";
  properties: { sessionID: string; todos: any[] };
}

export interface EventCommandExecuted {
  type: "command.executed";
  properties: { name: string; sessionID: string; arguments: string; messageID: string };
}

export interface EventSessionCreated {
  type: "session.created";
  properties: { info: any };
}

export interface EventSessionUpdated {
  type: "session.updated";
  properties: { info: any };
}

export interface EventSessionDeleted {
  type: "session.deleted";
  properties: { info: any };
}

export interface EventSessionDiff {
  type: "session.diff";
  properties: { sessionID: string; diff: any[] };
}

export interface EventSessionError {
  type: "session.error";
  properties: { sessionID?: string; error?: any };
}

export interface EventFileWatcherUpdated {
  type: "file.watcher.updated";
  properties: { file: string; event: "add" | "change" | "unlink" };
}

export interface EventVcsBranchUpdated {
  type: "vcs.branch.updated";
  properties: { branch?: string };
}

export interface EventTuiPromptAppend {
  type: "tui.prompt.append";
  properties: { text: string };
}

export interface EventTuiCommandExecute {
  type: "tui.command.execute";
  properties: { command: string };
}

export interface EventTuiToastShow {
  type: "tui.toast.show";
  properties: { title?: string; message: string; variant: "info" | "success" | "warning" | "error"; duration?: number };
}

export interface EventPtyCreated {
  type: "pty.created";
  properties: { info: any };
}

export interface EventPtyUpdated {
  type: "pty.updated";
  properties: { info: any };
}

export interface EventPtyExited {
  type: "pty.exited";
  properties: { id: string; exitCode: number };
}

export interface EventPtyDeleted {
  type: "pty.deleted";
  properties: { id: string };
}

export interface EventServerConnected {
  type: "server.connected";
  properties: { [key: string]: unknown };
}

export type SdkEvent =
  | EventServerInstanceDisposed
  | EventInstallationUpdated
  | EventInstallationUpdateAvailable
  | EventLspClientDiagnostics
  | EventLspUpdated
  | EventMessageUpdated
  | EventMessageRemoved
  | EventMessagePartUpdated
  | EventMessagePartRemoved
  | EventPermissionUpdated
  | EventPermissionReplied
  | EventSessionStatus
  | EventSessionIdle
  | EventSessionCompacted
  | EventFileEdited
  | EventTodoUpdated
  | EventCommandExecuted
  | EventSessionCreated
  | EventSessionUpdated
  | EventSessionDeleted
  | EventSessionDiff
  | EventSessionError
  | EventFileWatcherUpdated
  | EventVcsBranchUpdated
  | EventTuiPromptAppend
  | EventTuiCommandExecute
  | EventTuiToastShow
  | EventPtyCreated
  | EventPtyUpdated
  | EventPtyExited
  | EventPtyDeleted
  | EventServerConnected;

// Helper to handle events by type
export function handleEvent(evt: SdkEvent) {
  switch (evt.type) {
    case "session.created":
    case "session.updated":
    case "session.deleted":
      console.log(`session event: ${evt.type}`, evt.properties.info?.id);
      break;
    case "session.idle":
      console.log(`session idle: ${evt.properties.sessionID}`);
      break;
    case "session.status":
      console.log(`session status: ${evt.properties.sessionID} → ${JSON.stringify(evt.properties.status)}`);
      break;
    case "session.error":
      console.log(`session error: ${evt.properties.sessionID}`, evt.properties.error);
      break;
    case "message.updated":
      console.log(`message updated: ${evt.properties.info?.id}`);
      break;
    case "message.removed":
      console.log(`message removed: ${evt.properties.messageID}`);
      break;
    case "file.edited":
      console.log(`file edited: ${evt.properties.file}`);
      break;
    case "file.watcher.updated":
      console.log(`file watcher: ${evt.properties.file} → ${evt.properties.event}`);
      break;
    case "todo.updated":
      console.log(`todo updated: ${evt.properties.sessionID} (${evt.properties.todos.length} items)`);
      break;
    case "command.executed":
      console.log(`command: /${evt.properties.name} "${evt.properties.arguments}"`);
      break;
    case "permission.updated":
    case "permission.replied":
      console.log(`permission: ${evt.type}`);
      break;
    case "tui.prompt.append":
      console.log(`tui prompt append: "${evt.properties.text}"`);
      break;
    case "tui.command.execute":
      console.log(`tui command: ${evt.properties.command}`);
      break;
    case "tui.toast.show":
      console.log(`toast [${evt.properties.variant}]: ${evt.properties.message}`);
      break;
    case "pty.created":
    case "pty.updated":
      console.log(`pty ${evt.type}: ${evt.properties.info?.id}`);
      break;
    case "pty.exited":
      console.log(`pty exited: ${evt.properties.id} (code ${evt.properties.exitCode})`);
      break;
    case "pty.deleted":
      console.log(`pty deleted: ${evt.properties.id}`);
      break;
    case "lsp.client.diagnostics":
      console.log(`LSP diagnostics: ${evt.properties.serverID} — ${evt.properties.path}`);
      break;
    case "vcs.branch.updated":
      console.log(`branch: ${evt.properties.branch}`);
      break;
    case "installation.updated":
    case "installation.update-available":
      console.log(`version: ${evt.properties.version}`);
      break;
    case "server.connected":
    case "server.instance.disposed":
    case "lsp.updated":
    case "session.compacted":
    case "session.diff":
    case "message.part.updated":
    case "message.part.removed":
      console.log(`event: ${evt.type}`);
      break;
    default:
      console.log(`unknown event: ${(evt as any).type}`);
  }
}
