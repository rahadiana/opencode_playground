import type { Plugin } from "@opencode-ai/plugin";

const sessions = new Map<string, { messages: number; tokens: number; cost: number }>();

export const ContextInfo: Plugin = async ({ client }) => {
  return {
    event: async ({ event }) => {
      if (event.type === "session.created") {
        const sid = event.data?.session?.id ?? event.data?.id ?? "?";
        sessions.set(sid, { messages: 0, tokens: 0, cost: 0 });
      }

      if (event.type === "session.idle") {
        const sid = event.data?.session?.id ?? event.data?.id ?? "?";
        const c = sessions.get(sid);
        if (c) {
          await client.app.log({
            body: {
              service: "context-info",
              level: "info",
              message: "session idle — stats",
              extra: {
                sessionId: sid,
                messages: c.messages,
                tokens: c.tokens,
                cost: c.cost,
              },
            },
          });
          sessions.delete(sid);
        }
      }

      if (event.type === "message.updated") {
        const sid = event.data?.session?.id ?? "?";
        const c = sessions.get(sid);
        if (!c) return;
        c.messages += 1;
        const info = event.data?.message?.info ?? event.data?.info;
        if (info) {
          c.tokens += info.tokens?.input ?? 0;
          c.tokens += info.tokens?.output ?? 0;
          c.cost += info.cost ?? 0;
        }
      }
    },
  };
};
