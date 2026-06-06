import { StateGraph, START } from "@langchain/langgraph";
import { AgentState } from "./state.js";

function classifyInput(state: typeof AgentState.State) {
  if (state.input_type === "ingest") {
    return { next_step: "ingest" as const };
  }
  return { next_step: "retrieve" as const };
}

export function buildGraph() {
  const graph = new StateGraph(AgentState)
    .addNode("classify", classifyInput);

  // Worktree A: ingest pipeline nodes
  // Worktree B: query pipeline nodes
  // Worktree C: report pipeline nodes

  return graph;
}
