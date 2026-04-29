"use client";

import * as React from "react";
import {
  ChatInterfaceV2,
  type AgentStep,
  type ChatMessageType,
} from "@/components/v2/chat";

/**
 * Demo wrapper for the V2 chat surface.
 *
 * Mock streaming runner that simulates the full lifecycle:
 *   user message → thinking → tool steps → token-by-token reply → done.
 *
 * Replace the `runMockTurn` body with your real backend (Vercel AI SDK
 * `useChat`, LangGraph stream, /api/orchestrate, etc.) — the surface is
 * already wired to its prop contract.
 */
export default function ClientChatV2() {
  const [messages, setMessages] = React.useState<ChatMessageType[]>([]);
  const [liveSteps, setLiveSteps] = React.useState<AgentStep[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const cancelRef = React.useRef<(() => void) | null>(null);

  const onSubmit = (text: string, files?: File[]) => {
    const now = Date.now();
    const userMsg: ChatMessageType = {
      id: `u-${now}`,
      role: "user",
      content: text,
      createdAt: now,
      attachments: files?.map((f, i) => ({
        id: `a-${now}-${i}`,
        name: f.name,
        size: f.size,
        type: f.type,
      })),
    };
    setMessages((prev) => [...prev, userMsg]);
    void runMockTurn(text, {
      setMessages,
      setLiveSteps,
      setIsStreaming,
      registerCancel: (fn) => (cancelRef.current = fn),
    });
  };

  const onStop = () => {
    cancelRef.current?.();
  };

  const onRegenerate = () => {
    setMessages((prev) => {
      const lastUserIdx = [...prev].reverse().findIndex((m) => m.role === "user");
      if (lastUserIdx < 0) return prev;
      const idx = prev.length - 1 - lastUserIdx;
      const text = prev[idx].content;
      // Trim everything after the last user message and rerun.
      const trimmed = prev.slice(0, idx + 1);
      void runMockTurn(text, {
        setMessages: (updater) => setMessages(updater),
        setLiveSteps,
        setIsStreaming,
        registerCancel: (fn) => (cancelRef.current = fn),
      });
      return trimmed;
    });
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#050507]">
      <ChatInterfaceV2
        messages={messages}
        liveAgentSteps={liveSteps}
        isStreaming={isStreaming}
        onSubmit={onSubmit}
        onStop={onStop}
        onRegenerate={onRegenerate}
        userName="Friend"
        isPremium
      />
    </div>
  );
}

/* ============================================================
   Mock streaming runner — replace with real backend
   ============================================================ */

interface RunnerCtx {
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageType[]>>;
  setLiveSteps: React.Dispatch<React.SetStateAction<AgentStep[]>>;
  setIsStreaming: React.Dispatch<React.SetStateAction<boolean>>;
  registerCancel: (fn: () => void) => void;
}

async function runMockTurn(prompt: string, ctx: RunnerCtx) {
  const { setMessages, setLiveSteps, setIsStreaming, registerCancel } = ctx;
  let cancelled = false;
  registerCancel(() => {
    cancelled = true;
  });

  setIsStreaming(true);
  setLiveSteps([]);

  // Step plan based on the prompt — picks a richer flow if it looks code-y.
  const looksCode = /code|function|api|typescript|python|sql/i.test(prompt);
  const looksImage = /image|render|generate|draw|photo/i.test(prompt);

  const steps: AgentStep[] = looksImage
    ? [
        { id: "s1", kind: "thinking", label: "Reading your scene", status: "active" },
        { id: "s2", kind: "route", label: "Routing to image model", status: "active" },
        { id: "s3", kind: "image", label: "Composing render", status: "active", detail: "Aspect 3:2 · cinematic preset" },
      ]
    : looksCode
      ? [
          { id: "s1", kind: "thinking", label: "Understanding your question", status: "active" },
          { id: "s2", kind: "search", label: "Searching docs", status: "active", detail: "site:js.langchain.com supervisor" },
          { id: "s3", kind: "tool", label: "Drafting code", status: "active" },
        ]
      : [
          { id: "s1", kind: "thinking", label: "Listening", status: "active" },
          { id: "s2", kind: "memory", label: "Recalling context", status: "active", detail: "12 prior messages" },
        ];

  for (const s of steps) {
    if (cancelled) return abort();
    setLiveSteps((prev) => [...prev.map((p) => ({ ...p, status: "done" as const })), s]);
    await sleep(rand(700, 1300));
  }
  // Mark last step done.
  setLiveSteps((prev) => prev.map((p) => ({ ...p, status: "done" as const })));

  if (cancelled) return abort();

  // Now stream the message in.
  const reply = pickReply(prompt, { looksCode, looksImage });
  const id = `a-${Date.now()}`;
  setMessages((prev) => [
    ...prev,
    {
      id,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
      isStreaming: true,
      agentSteps: undefined,
    },
  ]);

  // Stream char-by-char with light variation.
  let acc = "";
  const tokens = chunkify(reply);
  for (const t of tokens) {
    if (cancelled) {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isStreaming: false, hasError: true } : m))
      );
      setIsStreaming(false);
      setLiveSteps([]);
      return;
    }
    acc += t;
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: acc } : m))
    );
    await sleep(t.length > 4 ? rand(20, 50) : rand(8, 22));
  }

  setMessages((prev) =>
    prev.map((m) =>
      m.id === id
        ? {
            ...m,
            isStreaming: false,
            agentSteps: steps.map((s) => ({
              ...s,
              status: "done" as const,
              durationMs: rand(600, 1400),
            })),
          }
        : m
    )
  );
  setLiveSteps([]);
  setIsStreaming(false);

  function abort() {
    setLiveSteps([]);
    setIsStreaming(false);
  }
}

function rand(a: number, b: number) {
  return Math.floor(a + Math.random() * (b - a));
}
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Split into ~natural token-ish chunks, preserving whitespace. */
function chunkify(s: string): string[] {
  const out: string[] = [];
  const re = /(\s+|`{3}[\s\S]*?`{3}|[\w'\-]+|[^\s\w])/g;
  let m;
  while ((m = re.exec(s))) out.push(m[0]);
  return out;
}

function pickReply(
  _prompt: string,
  hints: { looksCode: boolean; looksImage: boolean }
): string {
  if (hints.looksImage) {
    return `I can do that. Here's how I'd approach the brief:

- **Lighting** — soft window light from camera-left at ~45°, bounce on the right
- **Surface** — honed Carrara marble, warm undertone
- **Mood** — quiet, editorial, slightly desaturated

When you're ready, I'll send the prompt to the image router and place the render here. We can iterate on framing without leaving this thread.`;
  }
  if (hints.looksCode) {
    return `Use a **supervisor** when you have several specialized agents and the routing decision itself is non-trivial — i.e., the supervisor isn't just a switch statement, it's reasoning about *which* node should run next.

A ReAct agent is fine when one model + a small toolkit is enough. Reach for a supervisor when:

1. Agents have **non-overlapping** capabilities you want to keep clean
2. You need **branching** (sentiment, intent, entitlement gates) before reasoning
3. You want **resumable** execution with checkpoints and durable state

Minimal sketch:

\`\`\`ts
import { StateGraph, START, END } from "@langchain/langgraph";

type S = { messages: BaseMessage[]; route?: "voice" | "image" | "chat" };

const graph = new StateGraph<S>({ channels: { messages, route } })
  .addNode("supervisor", supervisorNode)
  .addNode("voice", voiceNode)
  .addNode("image", imageNode)
  .addNode("chat", chatNode)
  .addEdge(START, "supervisor")
  .addConditionalEdges("supervisor", (s) => s.route ?? "chat")
  .addEdge("voice", END)
  .addEdge("image", END)
  .addEdge("chat", END);
\`\`\`

In your repo, this fits well as the \`SupervisorGraph\` mentioned in the master plan — the conditional edge replaces a blob of \`if/else\` you'd otherwise spread across routes.`;
  }
  return `That sounds heavy. I'm here — take your time.

A few things you could do, no pressure to pick any of them:

- Tell me **what happened**, just plain and unedited
- If it's hard to start, give me one sentence and I'll ask
- If you'd rather not get into it tonight, we can talk about anything else

| When you feel like… | What I can do |
| --- | --- |
| Venting | Listen, no advice |
| Thinking | Mirror your reasoning back |
| Distracting | Pick a topic — books, code, kettlebells |

I'm not going anywhere.`;
}
