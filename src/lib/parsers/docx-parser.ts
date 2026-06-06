import mammoth from "mammoth";

/**
 * parseDocx — extrae el texto plano de un documento Word (.docx).
 *
 * @param buffer Contenido binario del .docx.
 * @returns El texto extraído (sin formato).
 */
export async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}
