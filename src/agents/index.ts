import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { GraphState, State } from "./state";
import { safetyNode } from "./specialists/safetyNode";
import { intentNode } from "./specialists/intentNode";
import { sentimentNode } from "./specialists/sentimentNode";
import { personaNode } from "./specialists/personaNode";
import { supervisorNode } from "./supervisor";
import { entitlementGateNode } from "./specialists/entitlementGateNode";
import { buddyAgent } from "./specialists/buddyAgent";
import { imageGenerationNode } from "./specialists/imageGenerationNode";
import { voiceNode } from "./specialists/voiceNode";
import { avatarSessionNode } from "./specialists/avatarSessionNode";
import { recommendationNode } from "./specialists/recommendationNode";
import { persistenceNode } from "./specialists/persistenceNode";

function routeFromSafety(state: State): "intentDetector" | "__end__" {
  if (!state.isSafe) return "__end__";
  return "intentDetector";
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
    // 1. Intelligence preprocessing
    .addNode("safety", safetyNode)
    .addNode("intentDetector", intentNode)
    .addNode("sentimentAnalyzer", sentimentNode)
    .addNode("personaInjector", personaNode)
    
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

    // Flow: START -> Safety
    .addEdge(START, "safety")
    
    // Safety -> conditional routing
    .addConditionalEdges("safety", routeFromSafety, {
      "intentDetector": "intentDetector",
      "__end__": END,
    })
    
    .addEdge("intentDetector", "sentimentAnalyzer")
    .addEdge("sentimentAnalyzer", "personaInjector")
    .addEdge("personaInjector", "supervisor")
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
