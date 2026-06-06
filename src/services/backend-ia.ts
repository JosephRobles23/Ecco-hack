// Worktree C: Backend IA Communication
// Forwards processed messages to hakelton backend and handles responses

import type {
  IngestRequest,
  IngestResponse,
  QueryRequest,
  QueryResponse,
} from "../types/api.js";
import { whatsapp } from "../kapso/client.js";

const BACKEND_IA_URL = process.env.BACKEND_IA_URL;
const BACKEND_IA_API_KEY = process.env.BACKEND_IA_API_KEY;

// WhatsApp caps a single text message body at 4096 characters.
const WHATSAPP_MAX_MESSAGE_LENGTH = 4096;

// The backend may spend time processing files on ingest, less so on query.
const INGEST_TIMEOUT_MS = 30_000;
const QUERY_TIMEOUT_MS = 15_000;

/**
 * POST a JSON payload to the backend IA with the shared API key and a timeout.
 * Throws on network error, timeout, or non-2xx response so callers can map the
 * failure to their own error response shape.
 */
async function postToBackend<T>(
  path: string,
  payload: unknown,
  timeoutMs: number
): Promise<T> {
  if (!BACKEND_IA_URL) {
    throw new Error("Missing BACKEND_IA_URL");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${BACKEND_IA_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": BACKEND_IA_API_KEY ?? "",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Backend IA responded ${response.status} ${response.statusText}${
          body ? `: ${body}` : ""
        }`
      );
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * sendToIngest — forward a processed message to POST /api/ingest.
 * Timeout 30s. On any failure returns an IngestResponse with status "error".
 */
export async function sendToIngest(payload: IngestRequest): Promise<IngestResponse> {
  try {
    return await postToBackend<IngestResponse>(
      "/api/ingest",
      payload,
      INGEST_TIMEOUT_MS
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[backend-ia] sendToIngest failed:", message);
    return {
      status: "error",
      reply_message:
        "No pude procesar tu mensaje en este momento. Por favor intentá de nuevo en unos minutos.",
      reply_type: "text",
      error: message,
    };
  }
}

/**
 * sendToQuery — forward a natural-language question to POST /api/query.
 * Timeout 15s. On any failure returns a QueryResponse with status "error".
 */
export async function sendToQuery(payload: QueryRequest): Promise<QueryResponse> {
  try {
    return await postToBackend<QueryResponse>(
      "/api/query",
      payload,
      QUERY_TIMEOUT_MS
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[backend-ia] sendToQuery failed:", message);
    return {
      status: "error",
      reply_message:
        "No pude responder tu consulta en este momento. Por favor intentá de nuevo en unos minutos.",
      reply_type: "text",
      error: message,
    };
  }
}

/**
 * Split a long string into chunks no larger than maxLength, preferring to break
 * on paragraph/line/word boundaries so messages stay readable.
 */
function splitMessage(
  message: string,
  maxLength = WHATSAPP_MAX_MESSAGE_LENGTH
): string[] {
  if (message.length <= maxLength) {
    return [message];
  }

  const chunks: string[] = [];
  let remaining = message;

  while (remaining.length > maxLength) {
    const window = remaining.slice(0, maxLength);

    // Prefer breaking on a newline, then a space, near the end of the window.
    let breakAt = window.lastIndexOf("\n");
    if (breakAt < maxLength * 0.5) {
      breakAt = window.lastIndexOf(" ");
    }
    if (breakAt <= 0) {
      // No good boundary — hard split at the limit.
      breakAt = maxLength;
    }

    chunks.push(remaining.slice(0, breakAt).trimEnd());
    remaining = remaining.slice(breakAt).trimStart();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
}

/**
 * sendWhatsAppReply — send the backend's reply back to the user via Kapso.
 *
 * - With a fileUrl, sends a document (message becomes the caption).
 * - Without a fileUrl, sends text, splitting messages over 4096 chars.
 * Never throws: send failures are logged so the caller's flow continues.
 */
export async function sendWhatsAppReply(
  phoneNumberId: string,
  to: string,
  message: string,
  fileUrl?: string
): Promise<void> {
  try {
    if (fileUrl) {
      await whatsapp.messages.sendDocument({
        phoneNumberId,
        to,
        document: {
          link: fileUrl,
          caption: message,
          filename: "reporte.pdf",
        },
      });
      return;
    }

    const parts = splitMessage(message);
    for (const part of parts) {
      await whatsapp.messages.sendText({ phoneNumberId, to, body: part });
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[backend-ia] sendWhatsAppReply failed:", detail);
  }
}
