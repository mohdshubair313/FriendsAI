import { State } from "../state";
import { AIMessage } from "@langchain/core/messages";

/**
 * Entitlement Gate Node
 * Acts as a strict firewall before routing to premium-only specialist agents (like Visual or TTS).
 * This ensures the graph explicitly halts execution and prompts for an upgrade if
 * a user attempts to bypass UI restrictions and trigger premium features via prompt injection.
 */
export async function entitlementGateNode(state: State) {
  // If the user is trying to reach a premium node but is not premium
  if (state.next === "visual" && !state.premium) {
    console.log("[EntitlementGate] Blocked access to premium feature.");
    return {
      messages: [new AIMessage("Generating images is a Premium feature. Please upgrade your account to unlock this capability.")],
      finalResponse: true,
      next: "FINISH"
    };
  }

  // Pass-through if entitled
  return { next: state.next };
}
