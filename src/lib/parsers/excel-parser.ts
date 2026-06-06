import * as XLSX from "xlsx";

/**
 * parseExcel — parsea un archivo Excel (.xlsx) o CSV.
 *
 * Devuelve dos representaciones del contenido:
 *  - `text`: una versión tabular legible (CSV por hoja) lista para embeddear.
 *  - `rows`: cada fila como objeto JSON (clave = encabezado de columna),
 *    concatenando todas las hojas del libro.
 *
 * @param buffer Contenido binario del archivo.
 */
export async function parseExcel(
  buffer: Buffer
): Promise<{ text: string; rows: Record<string, any>[] }> {
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const rows: Record<string, any>[] = [];
  const textChunks: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // Filas como JSON (con encabezados como claves).
    const sheetRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: null,
    });
    rows.push(...sheetRows);

    // Versión tabular legible para el embedding / extracción.
    const csv = XLSX.utils.sheet_to_csv(sheet).trim();
    if (csv) {
      textChunks.push(
        workbook.SheetNames.length > 1 ? `# ${sheetName}\n${csv}` : csv
      );
    }
  }

  return {
    text: textChunks.join("\n\n").trim(),
    rows,
  };
}
