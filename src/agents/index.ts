import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { GraphState, State } from "./state";
import { preprocessNode } from "./specialists/preprocessNode";
import { sentimentNode } from "./specialists/sentimentNode";
// personaNode was removed: identity instructions are inlined into
// buddyAgent's system prompt to avoid double-injection and the
// `[...state.messages, personaContext]` doubling caused by the
// concat-reducer on `messages`.
import { supervisorNode } from "./supervisor";
import { entitlementGateNode } from "./specialists/entitlementGateNode";
import { buddyAgent } from "./specialists/buddyAgent";
import { imageGenerationNode } from "./specialists/imageGenerationNode";
import { voiceNode } from "./specialists/voiceNode";
import { avatarSessionNode } from "./specialists/avatarSessionNode";
import { recommendationNode } from "./specialists/recommendationNode";
import { persistenceNode } from "./specialists/persistenceNode";

function routeFromPreprocess(state: State): "sentimentAnalyzer" | "__end__" {
  if (!state.isSafe) return "__end__";
  return "sentimentAnalyzer";
}

function routeFromEntitlement(state: State): "buddy" | "imageGeneration" | "voice" | "avatarSession" | "recommendation" | "__end__" {
  if (state.next === "FINISH") return "__end__";
  if (state.next === "visual") return "imageGeneration";
  if (state.next === "voice") return "voice";
  if (state.next === "avatarSession") return "avatarSession";
  if (state.next === "recommendation") return "recommendation";
  return "buddy";
}

function routeFromAgent(state: State): "persistence" | "supervisor" {
  if (state.finalResponse) return "persistence";
  return "supervisor";
}

export function createAgentGraph() {
  const workflow = new StateGraph(GraphState)
    // 1. Intelligence preprocessing — safety + intent in parallel
    .addNode("preprocess", preprocessNode)
    .addNode("sentimentAnalyzer", sentimentNode)

    // 2. Routing & Action
    .addNode("supervisor", supervisorNode)
    .addNode("entitlementGate", entitlementGateNode)

    // Action Nodes
    .addNode("buddy", buddyAgent)
    .addNode("imageGeneration", imageGenerationNode)
    .addNode("voice", voiceNode)
    .addNode("avatarSession", avatarSessionNode)
    .addNode("recommendation", recommendationNode)

    // 3. Post-processing
    .addNode("persistence", persistenceNode)

    // Flow: START -> Preprocess (safety+intent in parallel)
    .addEdge(START, "preprocess")

    // Preprocess -> conditional routing on safety result
    .addConditionalEdges("preprocess", routeFromPreprocess, {
      "sentimentAnalyzer": "sentimentAnalyzer",
      "__end__": END,
    })

    .addEdge("sentimentAnalyzer", "supervisor")
    .addEdge("supervisor", "entitlementGate")

    // EntitlementGate -> conditional routing with path_map
    .addConditionalEdges("entitlementGate", routeFromEntitlement, {
      "buddy": "buddy",
      "imageGeneration": "imageGeneration",
      "voice": "voice",
      "avatarSession": "avatarSession",
      "recommendation": "recommendation",
      "__end__": END,
    })

    // Specialist agents return to either persistence or supervisor
    .addConditionalEdges("buddy", routeFromAgent, {
      "persistence": "persistence",
      "supervisor": "supervisor",
    })
    .addConditionalEdges("imageGeneration", routeFromAgent, {
      "persistence": "persistence",
      "supervisor": "supervisor",
    })
    .addConditionalEdges("voice", routeFromAgent, {
      "persistence": "persistence",
      "supervisor": "supervisor",
    })
    .addConditionalEdges("avatarSession", routeFromAgent, {
      "persistence": "persistence",
      "supervisor": "supervisor",
    })
    .addConditionalEdges("recommendation", routeFromAgent, {
      "persistence": "persistence",
      "supervisor": "supervisor",
    })

    // Persistence goes to END
    .addEdge("persistence", END);

  // Use MemorySaver only with proper thread_id - we handle errors in the route
  return workflow.compile({ checkpointer: new MemorySaver() });
}

export const agentGraph = createAgentGraph();
