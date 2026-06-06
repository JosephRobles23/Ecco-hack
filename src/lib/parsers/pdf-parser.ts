import pdf from "pdf-parse";

/**
 * parsePdf — extrae el texto plano de un PDF.
 *
 * @param buffer Contenido binario del PDF.
 * @returns El texto extraído (puede ser "" si el PDF no tiene capa de texto).
 */
export async function parsePdf(buffer: Buffer): Promise<string> {
  const result = await pdf(buffer);
  return result.text.trim();
}
