// Worktree A: Webhook Handler
// Handles whatsapp.message.received events from Kapso.
//
// Flujo: valida la firma (middleware) -> responde 200 OK al instante ->
// procesa en background (clasifica QUERY vs INGEST, resuelve sesión, reenvía
// al Backend IA y responde al usuario por WhatsApp).
import { Router } from "express";
import { z } from "zod";
import { verifyKapsoSignature } from "../middleware/verify-signature.js";
import { PHONE_NUMBER_ID } from "../kapso/client.js";
import { resolveSession, getWelcomeMessage } from "../services/session-manager.js";
import { processMedia } from "../services/media-processor.js";
import {
  sendToIngest,
  sendToQuery,
  sendWhatsAppReply,
} from "../services/backend-ia.js";
import type {
  IngestRequest,
  KapsoWebhookPayload,
  ProcessedMedia,
  QueryRequest,
} from "../types/api.js";

export const webhookRouter = Router();

/* ============================================================================
 * Mensajes al usuario (es-AR)
 * ========================================================================== */

const MESSAGES = {
  locationUnsupported:
    "📍 Por ahora no puedo procesar ubicaciones. " +
    "Podés contarme la actividad por texto, audio, imagen o documento.",
  genericError:
    "⚠️ Ups, tuve un problema procesando tu mensaje. " +
    "Por favor intentá de nuevo en unos minutos.",
} as const;

/** Tipos de mensaje de Kapso que efectivamente procesamos. */
const PROCESSABLE_TYPES = new Set(["text", "image", "audio", "document"]);

/* ============================================================================
 * Validación del payload (zod)
 * ========================================================================== */

const mediaDataSchema = z
  .object({
    url: z.string().optional(),
    filename: z.string().optional(),
    content_type: z.string().optional(),
    byte_size: z.number().optional(),
  })
  .passthrough();

const webhookSchema = z
  .object({
    message: z
      .object({
        id: z.string(),
        timestamp: z.string(),
        type: z.string(),
        from: z.string(),
        text: z.object({ body: z.string() }).optional(),
        image: z.object({ caption: z.string().optional() }).passthrough().optional(),
        video: z.object({ caption: z.string().optional() }).passthrough().optional(),
        document: z
          .object({ caption: z.string().optional(), filename: z.string().optional() })
          .passthrough()
          .optional(),
        kapso: z
          .object({
            direction: z.string(),
            has_media: z.boolean().optional().default(false),
            content: z.string().optional().default(""),
            media_url: z.string().optional(),
            media_data: mediaDataSchema.optional(),
            transcript: z.object({ text: z.string() }).optional(),
          })
          .passthrough(),
      })
      .passthrough(),
    conversation: z
      .object({ id: z.string(), phone_number: z.string() })
      .passthrough(),
    is_new_conversation: z.boolean().optional().default(false),
    phone_number_id: z.string(),
  })
  .passthrough();

/* ============================================================================
 * Ruta del webhook
 * ========================================================================== */

webhookRouter.post(
  "/webhooks/whatsapp",
  verifyKapsoSignature,
  (req, res) => {
    // Respondemos 200 OK siempre y al instante (requisito Kapso: < 10s).
    res.status(200).send("OK");

    const parsed = webhookSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error("[webhook] invalid Kapso payload:", parsed.error.flatten());
      return;
    }

    // Procesamos en background; el envío de respuesta ya ocurrió.
    void processMessage(parsed.data as unknown as KapsoWebhookPayload);
  }
);

/* ============================================================================
 * Procesamiento principal
 * ========================================================================== */

async function processMessage(payload: KapsoWebhookPayload): Promise<void> {
  const { message, conversation, is_new_conversation } = payload;
  const { kapso } = message;
  const to = message.from;
  const phoneNumberId = payload.phone_number_id || PHONE_NUMBER_ID;

  try {
    // 1. Ignorar mensajes que no sean entrantes.
    if (kapso.direction !== "inbound") {
      return;
    }

    // 2. Ubicación: avisamos que no se soporta (antes de filtrar por tipo).
    if (message.type === "location") {
      await sendWhatsAppReply(phoneNumberId, to, MESSAGES.locationUnsupported);
      return;
    }

    // 3. Ignorar reactions, contacts, interactive, video y tipos desconocidos.
    if (!PROCESSABLE_TYPES.has(message.type)) {
      return;
    }

    // 4. Resolver organización/usuario a partir del teléfono.
    const session = await resolveSession(to);

    // Número no registrado: saludamos/informamos y cortamos (no hay org_id).
    if (!session.is_registered || !session.org_id || !session.user_id) {
      await sendWhatsAppReply(phoneNumberId, to, getWelcomeMessage(false));
      return;
    }

    // 5. Bienvenida en conversaciones nuevas, antes de procesar.
    if (is_new_conversation) {
      await sendWhatsAppReply(phoneNumberId, to, getWelcomeMessage(true));
    }

    // 6. Clasificar: con media -> INGEST; texto puro -> QUERY.
    if (kapso.has_media) {
      await handleIngest(payload, phoneNumberId, session.org_id, session.user_id);
    } else if (message.type === "text") {
      await handleQuery(payload, phoneNumberId, session.org_id, session.user_id);
    } else {
      // Tipo multimedia sin adjunto: nada que procesar.
      console.warn(
        `[webhook] media type "${message.type}" without media (${message.id}); skipping`
      );
    }
  } catch (err) {
    // 7. Cualquier fallo -> aviso genérico (sendWhatsAppReply nunca lanza).
    console.error(`[webhook] error processing message ${message.id}:`, err);
    await sendWhatsAppReply(phoneNumberId, to, MESSAGES.genericError);
  }
}

/* ============================================================================
 * QUERY — texto puro (pregunta del usuario)
 * ========================================================================== */

async function handleQuery(
  payload: KapsoWebhookPayload,
  phoneNumberId: string,
  orgId: string,
  userId: string
): Promise<void> {
  const { message, conversation } = payload;

  const text = (message.text?.body ?? message.kapso.content ?? "").trim();
  if (!text) {
    console.warn(`[webhook] empty text query (${message.id}); skipping`);
    return;
  }

  const request: QueryRequest = {
    message_id: message.id,
    org_id: orgId,
    sender_id: userId,
    source: "whatsapp",
    message: text,
    conversation_id: conversation.id,
  };

  const response = await sendToQuery(request);
  await sendWhatsAppReply(
    phoneNumberId,
    message.from,
    response.reply_message,
    response.reply_file_url
  );
}

/* ============================================================================
 * INGEST — mensaje con archivo adjunto
 * ========================================================================== */

async function handleIngest(
  payload: KapsoWebhookPayload,
  phoneNumberId: string,
  orgId: string,
  userId: string
): Promise<void> {
  const { message } = payload;
  const { kapso } = message;

  const mediaUrl = kapso.media_url ?? kapso.media_data?.url;
  if (!mediaUrl) {
    throw new Error(`message ${message.id} marked has_media but has no media_url`);
  }
  const mimeType = kapso.media_data?.content_type ?? "application/octet-stream";
  const fileName = kapso.media_data?.filename ?? message.id;

  // Descargar + preprocesar el archivo (Worktree B).
  const processed = await processMedia(mediaUrl, mimeType, fileName, orgId);

  const request = buildIngestRequest(payload, orgId, userId, processed);
  const response = await sendToIngest(request);

  await sendWhatsAppReply(
    phoneNumberId,
    message.from,
    response.reply_message,
    response.reply_file_url
  );
}

function buildIngestRequest(
  payload: KapsoWebhookPayload,
  orgId: string,
  userId: string,
  processed: ProcessedMedia
): IngestRequest {
  const { message, conversation } = payload;

  // Caption del adjunto, según el tipo; fallback al content plano de Kapso.
  const caption =
    message.image?.caption ??
    message.document?.caption ??
    message.video?.caption ??
    message.text?.body ??
    (message.kapso.content || null);

  const hasPreprocessing =
    processed.extracted_text != null || processed.excel_json != null;

  return {
    message_id: message.id,
    org_id: orgId,
    sender_id: userId,
    source: "whatsapp",
    timestamp: toIso8601(message.timestamp),
    content_type: processed.content_type,
    text_content: caption,
    file: {
      storage_url: processed.storage_url,
      storage_path: processed.storage_path,
      mime_type: processed.mime_type,
      file_name: processed.file_name,
      file_size: processed.file_size,
      file_base64: processed.file_base64,
    },
    ...(hasPreprocessing
      ? {
          preprocessed: {
            ...(processed.extracted_text != null
              ? { extracted_text: processed.extracted_text }
              : {}),
            ...(processed.excel_json != null
              ? { excel_json: processed.excel_json }
              : {}),
          },
        }
      : {}),
    conversation_id: conversation.id,
  };
}

/** Convierte el timestamp de Kapso (epoch en segundos, string) a ISO 8601. */
function toIso8601(timestamp: string): string {
  const seconds = Number(timestamp);
  if (Number.isFinite(seconds) && seconds > 0) {
    return new Date(seconds * 1000).toISOString();
  }
  return new Date().toISOString();
}
