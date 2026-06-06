# Worktree Assignment — 3 Agentes Independientes

## Proyecto: Ecco WhatsApp Gateway (Kapso AI)

Este es el WhatsApp Gateway que recibe mensajes de WhatsApp via Kapso AI,
los procesa, y los reenvía al Backend IA (hakelton) para análisis.

---

## Worktree A: Webhook Reception + Message Routing

**Branch:** `feature/webhook-handler`

**Archivos a implementar:**
- `src/webhooks/message-received.ts` — reemplazar stub con lógica real

**Responsabilidades:**
1. Parsear el KapsoWebhookPayload (validar con zod)
2. Clasificar el tipo de mensaje (texto puro → query, tiene archivo → ingest)
3. Para texto: llamar a backendIa.sendToQuery()
4. Para media: llamar a mediaProcessor.processMedia() y luego backendIa.sendToIngest()
5. Con la respuesta del backend, llamar a backendIa.sendWhatsAppReply()
6. Manejar errores y enviar mensaje de error al usuario
7. Manejar conversaciones nuevas (is_new_conversation)

**NO tocar:** `src/services/media-processor.ts`, `src/services/backend-ia.ts`

**Usa como dependencia:** Los stubs de media-processor y backend-ia (llama sus funciones, no las implementa)

---

## Worktree B: Media Processing + Supabase Storage

**Branch:** `feature/media-processing`

**Archivos a implementar:**
- `src/services/media-processor.ts` — reemplazar stubs con lógica real
- `src/lib/parsers/pdf-parser.ts` — wrapper de pdf-parse
- `src/lib/parsers/excel-parser.ts` — wrapper de xlsx (SheetJS)
- `src/lib/parsers/docx-parser.ts` — wrapper de mammoth

**Responsabilidades:**
1. downloadMedia(): descarga el archivo desde kapso.media_url (GET con auth)
2. uploadToStorage(): sube el buffer a Supabase Storage (bucket whatsapp-ingesta)
3. processMedia(): orquesta download → parse → upload → return ProcessedMedia
4. mimeToContentType(): mapea MIME types a ContentType
5. Para PDF/Excel/Docx: parsear y extraer texto (preprocessed.extracted_text)
6. Para Excel: también generar preprocessed.excel_json
7. Para audio/imagen: pasar directo sin parseo (el backend IA embeddea directo)
8. Convertir a base64 para el campo file_base64

**NO tocar:** `src/webhooks/message-received.ts`, `src/services/backend-ia.ts`

**Directorio nuevo:** `src/lib/parsers/`

---

## Worktree C: Backend IA Communication + Reply Delivery

**Branch:** `feature/backend-communication`

**Archivos a implementar:**
- `src/services/backend-ia.ts` — reemplazar stubs con lógica real
- `src/services/session-manager.ts` — (nuevo) manejo de sesiones de conversación

**Responsabilidades:**
1. sendToIngest(): construye IngestRequest y hace POST a BACKEND_IA_URL/api/ingest
2. sendToQuery(): construye QueryRequest y hace POST a BACKEND_IA_URL/api/query
3. sendWhatsAppReply(): envía la respuesta del backend al usuario via Kapso SDK
   - Si reply_type es "text": enviar texto con client.messages.sendText()
   - Si reply_type es "document": enviar documento con client.messages.sendDocument()
4. Session manager: buscar/crear org_id y user_id a partir del phone_number
   - Lookup en Supabase: users.phone → user.org_id
   - Si no existe: enviar mensaje de onboarding
5. Manejar timeouts y reintentos al comunicar con el backend IA
6. Formatear mensajes largos del backend para WhatsApp (max 4096 chars)

**NO tocar:** `src/webhooks/message-received.ts`, `src/services/media-processor.ts`

**Archivo nuevo:** `src/services/session-manager.ts`

---

## Archivos compartidos (NO MODIFICAR en worktrees)

| Archivo | Propósito |
|---|---|
| `src/server.ts` | Entry point Express + webhook router |
| `src/kapso/client.ts` | WhatsAppClient de Kapso (singleton) |
| `src/middleware/verify-signature.ts` | HMAC-SHA256 signature verification |
| `src/types/api.ts` | Tipos de Kapso, Backend IA, y internos |
| `src/types/database.ts` | Tipos de Supabase |
| `src/lib/supabase/client.ts` | Supabase client |
| `package.json` | Dependencias |
| `tsconfig.json` | TypeScript config |

---

## Merge Strategy

1. Merge B → main (media processor, parsers — archivos nuevos)
2. Merge C → main (backend-ia, session-manager — archivos nuevos)
3. Merge A → main (webhook handler que usa B y C — puede ir último)

Sin conflictos: cada worktree trabaja en archivos distintos.
