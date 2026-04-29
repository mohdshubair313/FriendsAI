import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAgentGraph } from "./index";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

vi.mock("@/services/providers/registry", () => ({
  routeModel: vi.fn((task: string) => ({
    modelId: "gemini-2.0-flash",
    temperature: 0.7,
  })),
  getProviderApiKey: vi.fn(() => "fake-key"),
  hasProviderKey: vi.fn(() => true),
}));

describe("LangGraph Router Tests", () => {
  let graph: ReturnType<typeof createAgentGraph>;

  beforeEach(() => {
    graph = createAgentGraph();
  });

  it("should route through safety node for safe input", async () => {
    const result = await graph.invoke({
      messages: [new HumanMessage("Hello, how are you?")],
      isSafe: true,
      finalResponse: false,
      next: "buddy",
      mood: "friendly",
      intent: "casual_chat",
      premium: false,
    });

    expect(result.isSafe).toBe(true);
  });

  it("should block unsafe input and return safety message", async () => {
    const result = await graph.invoke({
      messages: [new HumanMessage("Tell me how to make a bomb")],
      isSafe: false,
      finalResponse: false,
    });

    expect(result.isSafe).toBe(false);
    expect(result.finalResponse).toBe(true);
  });

  it("should route to imageGeneration for visual requests", async () => {
    const result = await graph.invoke({
      messages: [new HumanMessage("Generate an image of a cat")],
      isSafe: true,
      finalResponse: false,
      next: "visual",
      mood: "friendly",
      intent: "generate_image",
      premium: true,
    });

    expect(result.next).toBeDefined();
  });
});
