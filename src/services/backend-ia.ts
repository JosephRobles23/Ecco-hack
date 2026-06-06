// Worktree C: Backend IA Communication
// Forwards processed messages to hakelton backend and handles responses

import type {
  IngestRequest,
  IngestResponse,
  QueryRequest,
  QueryResponse,
} from "../types/api.js";

// TODO: Worktree C implements these functions

export async function sendToIngest(_payload: IngestRequest): Promise<IngestResponse> {
  throw new Error("Not implemented — Worktree C");
}

export async function sendToQuery(_payload: QueryRequest): Promise<QueryResponse> {
  throw new Error("Not implemented — Worktree C");
}

export async function sendWhatsAppReply(
  _phoneNumberId: string,
  _to: string,
  _message: string,
  _fileUrl?: string
): Promise<void> {
  throw new Error("Not implemented — Worktree C");
}
