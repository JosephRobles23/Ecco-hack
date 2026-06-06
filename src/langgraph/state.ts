import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  // --- Input ---
  source: Annotation<"whatsapp" | "web">,
  org_id: Annotation<string>,
  sender_id: Annotation<string>,
  conversation_id: Annotation<string | undefined>,

  // --- Content ---
  input_type: Annotation<"ingest" | "query" | "report">,
  content_type: Annotation<string>,
  text_content: Annotation<string | null>,
  file_base64: Annotation<string | null>,
  file_mime_type: Annotation<string | null>,
  file_storage_path: Annotation<string | null>,
  preprocessed_text: Annotation<string | null>,

  // --- Processing ---
  embedding: Annotation<number[] | null>,
  extracted_data: Annotation<Record<string, any> | null>,
  retrieved_context: Annotation<string | null>,

  // --- Routing ---
  next_step: Annotation<"retrieve" | "generate" | "clarify" | "ingest">,

  // --- Output ---
  reply_message: Annotation<string>,
  reply_type: Annotation<"text" | "document" | "chart_data">,
  created_records: Annotation<Record<string, any> | null>,

  // --- Conversation history ---
  messages: Annotation<any[]>,
});

export type AgentStateType = typeof AgentState.State;
