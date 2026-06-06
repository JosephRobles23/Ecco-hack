// Worktree B: Media Processing
// Downloads media from Kapso, parses files, uploads to Supabase Storage

import { v4 as uuidv4 } from "uuid";

import { supabase } from "../lib/supabase/client.js";
import { parsePdf } from "../lib/parsers/pdf-parser.js";
import { parseExcel } from "../lib/parsers/excel-parser.js";
import { parseDocx } from "../lib/parsers/docx-parser.js";
import type { ProcessedMedia, ContentType } from "../types/api.js";

/** Bucket de Supabase Storage donde se guardan los archivos originales. */
const STORAGE_BUCKET = "whatsapp-ingesta";

/**
 * downloadMedia — descarga un archivo desde la Media API de Kapso.
 *
 * Kapso requiere el header `X-API-Key` con la KAPSO_API_KEY del entorno.
 *
 * @param mediaUrl URL de descarga provista por el webhook (`kapso.media_url`).
 * @returns El contenido del archivo como Buffer.
 */
export async function downloadMedia(mediaUrl: string): Promise<Buffer> {
  const apiKey = process.env.KAPSO_API_KEY;
  if (!apiKey) {
    throw new Error("Falta KAPSO_API_KEY en el entorno");
  }

  const response = await fetch(mediaUrl, {
    method: "GET",
    headers: { "X-API-Key": apiKey },
  });

  if (!response.ok) {
    throw new Error(
      `Error descargando media de Kapso (${response.status} ${response.statusText}): ${mediaUrl}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * uploadToStorage — sube un buffer a Supabase Storage.
 *
 * El path sigue el patrón `originals/{orgId}/{YYYY-MM-DD}/{uuid}_{fileName}`
 * para evitar colisiones y mantener los archivos organizados por ONG y fecha.
 *
 * @param buffer   Contenido del archivo.
 * @param orgId    UUID de la organización.
 * @param fileName Nombre original del archivo.
 * @returns La URL pública y el path dentro del bucket.
 */
export async function uploadToStorage(
  buffer: Buffer,
  orgId: string,
  fileName: string
): Promise<{ url: string; path: string }> {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const path = `originals/${orgId}/${date}/${uuidv4()}_${fileName}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, { upsert: false });

  if (error) {
    throw new Error(`Error subiendo archivo a Supabase Storage: ${error.message}`);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  return { url: data.publicUrl, path };
}

/**
 * mimeToContentType — mapea un MIME type a la categoría `ContentType`.
 *
 * Cualquier MIME no reconocido cae en "text" como fallback seguro.
 */
export function mimeToContentType(mimeType: string): ContentType {
  // Normalizamos: sacamos parámetros (ej. "; charset=utf-8") y pasamos a minúsculas.
  const normalized = mimeType.split(";")[0]!.trim().toLowerCase();

  switch (normalized) {
    case "audio/ogg":
    case "audio/mpeg":
    case "audio/wav":
      return "audio";

    case "image/jpeg":
    case "image/png":
    case "image/webp":
      return "image";

    case "application/pdf":
      return "pdf";

    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "text/csv":
      return "excel";

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "docx";

    default:
      return "text";
  }
}

/**
 * processMedia — orquesta el pipeline completo de procesamiento de un archivo.
 *
 * 1. Descarga el archivo desde Kapso.
 * 2. Lo convierte a base64 (para embedding multimodal en el Backend IA).
 * 3. Lo sube a Supabase Storage.
 * 4. Lo parsea según su tipo:
 *    - PDF  → extracted_text (pdf-parse)
 *    - Excel/CSV → excel_json + extracted_text (xlsx)
 *    - Docx → extracted_text (mammoth)
 *    - audio/imagen → no se parsea (el Backend IA los embeddea directo)
 *
 * @param mediaUrl URL de descarga de Kapso.
 * @param mimeType MIME type del archivo.
 * @param fileName Nombre original del archivo.
 * @param orgId    UUID de la organización.
 * @returns Un `ProcessedMedia` con toda la info para el Backend IA.
 */
export async function processMedia(
  mediaUrl: string,
  mimeType: string,
  fileName: string,
  orgId: string
): Promise<ProcessedMedia> {
  // 1. Descargar el binario.
  const buffer = await downloadMedia(mediaUrl);

  // 2. Base64 para el embedding multimodal directo.
  const fileBase64 = buffer.toString("base64");

  // 3. Subir el original a Supabase Storage.
  const { url, path } = await uploadToStorage(buffer, orgId, fileName);

  // 4. Determinar el tipo y parsear si corresponde.
  const contentType = mimeToContentType(mimeType);

  let extractedText: string | undefined;
  let excelJson: Record<string, any>[] | undefined;

  switch (contentType) {
    case "pdf": {
      extractedText = await parsePdf(buffer);
      break;
    }
    case "excel": {
      const { text, rows } = await parseExcel(buffer);
      extractedText = text;
      excelJson = rows;
      break;
    }
    case "docx": {
      extractedText = await parseDocx(buffer);
      break;
    }
    // audio / image / text: el Backend IA los procesa directo, sin parseo aquí.
    default:
      break;
  }

  return {
    content_type: contentType,
    mime_type: mimeType,
    file_name: fileName,
    file_size: buffer.byteLength,
    storage_url: url,
    storage_path: path,
    file_base64: fileBase64,
    extracted_text: extractedText,
    excel_json: excelJson,
  };
}
