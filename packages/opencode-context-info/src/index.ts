import type { Plugin } from "@opencode-ai/plugin";

const sessions = new Map<string, { messages: number; tokens: number; cost: number }>();

export const ContextInfo: Plugin = async ({ client }) => {
  return {
    event: async ({ event }) => {
      if (event.type === "session.created") {
        const p = event.properties as any;
        sessions.set(p.info.id, { messages: 0, tokens: 0, cost: 0 });
      }

      if (event.type === "session.idle") {
        const p = event.properties as any;
        const c = sessions.get(p.sessionID);
        if (!c) return;
        await client.app.log({
          body: {
            service: "context-info",
            level: "info",
            message: "session idle — stats",
            extra: {
              sessionId: p.sessionID,
              messages: c.messages,
              tokens: c.tokens,
              cost: c.cost,
            },
          },
        });
        sessions.delete(p.sessionID);
      }

      if (event.type === "message.updated") {
        const msg = (event.properties as any).info;
        if (msg.role !== "assistant") return;
        const sid = msg.sessionID;
        const c = sessions.get(sid);
        if (!c) return;
        c.messages += 1;
        c.tokens += (msg.tokens?.input ?? 0) + (msg.tokens?.output ?? 0);
        c.cost += msg.cost ?? 0;
      }
    },
  };
};
