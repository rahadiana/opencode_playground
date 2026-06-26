# OpenCode SDK Scripts

Kumpulan script SDK reference untuk opencode plugin development.

## Struktur

```
.opencode/
├── scripts/           # SDK script examples per API
│   ├── 01-session.ts        # Session API (21 methods)
│   ├── 02-config.ts         # Config API (3 methods)
│   ├── 03-path-vcs-find.ts  # Path / VCS / Find API (5 methods)
│   ├── 04-file-global-app-auth.ts  # File / Global / App / Auth API
│   ├── 05-tui-pty-events.ts # TUI / PTY / Events API (13 methods)
│   ├── 06-events-ref.ts     # Event types + discriminated union + handler
│   ├── 07-plugin-hooks.ts   # 17 plugin hooks (chat, tool, permission, etc.)
│   ├── 08-agent-task-todo.ts # Agent, task, & todo management
│   ├── 09-dynamic-agent.ts  # Dynamic agent creation (5 methods)
│   ├── 10-inter-agent.ts    # Inter-agent communication patterns
│   ├── 11-skills.ts         # Skills: read, write, main/subagent usage
│   └── index.ts             # Runner: execute all scripts
├── skills/            # Contoh skill SKILL.md files
│   ├── git-release/SKILL.md
│   ├── code-review/SKILL.md
│   └── testing/SKILL.md
├── plugins/           # Existing plugin examples
│   ├── ContextInfo.ts
│   └── ViewAllModels.ts
├── SDK-REFERENCE.md   # Full SDK reference docs
└── package.json
```

## Cakupan Script

| File | API | Methods/Hooks |
|------|-----|---------------|
| `01-session.ts` | Session | create, list, get, update, delete, children, init, abort, share, unshare, summarize, prompt (3 varian), command, shell, status, messages, message, revert, unrevert, todo, permission |
| `02-config.ts` | Config | get, update, providers |
| `03-path-vcs-find.ts` | Path/VCS/Find | path.get, vcs.get, find.text, find.files, find.symbols |
| `04-file-global-app-auth.ts` | File/Global/App/Auth | file.read, file.status, global.health, app.log, app.agents, auth.set |
| `05-tui-pty-events.ts` | TUI/PTY/Events | append/clear/submit prompt, showToast, executeCommand, open dialogs, pty CRUD, event.subscribe |
| `06-events-ref.ts` | Events | 30 event type interfaces + discriminated union `SdkEvent` + `handleEvent()` |
| `07-plugin-hooks.ts` | Hooks | 17 hooks: event, chat.message, chat.params, chat.headers, permission.ask, command.execute.before, tool, tool.execute.before/after, tool.definition, shell.env, config, auth, provider, experimental.compaction (2), dispose |
| `08-agent-task-todo.ts` | Agent/Task/Todo | app.agents, session.todo, session.fork, agent/subtask parts, session status, custom tools |
| `09-dynamic-agent.ts` | Dynamic Agent | 5 creation methods (config, markdown, config.update, plugin hook, CLI), register runtime agent, agent tools |
| `10-inter-agent.ts` | Inter-Agent | Task tool, subtask part, agent part, child sessions, fork, message passing (inbox pattern), orchestration, coordination tools, event-based coordination |
| `11-skills.ts` | Skills | SKILL.md format, read/write skill, skill di main agent, skill di subagent, permission, custom tools, auto-loader plugin |

## Cara Pakai

```bash
# Compile check
cd .opencode && npx tsc --noEmit --strict scripts/*.ts

# Run all scripts (butuh server running)
npx tsx .opencode/scripts/index.ts
```

Semua script compile clean dengan `--strict` mode.
