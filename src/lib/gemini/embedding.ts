import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SUPPORTED_MIME: Record<string, string> = {
  "audio/ogg": "audio/ogg",
  "audio/mpeg": "audio/mpeg",
  "audio/wav": "audio/wav",
  "image/jpeg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
  "application/pdf": "application/pdf",
};

export interface EmbedInput {
  text?: string | null;
  fileBase64?: string | null;
  mimeType?: string | null;
}

export async function embedContent(input: EmbedInput): Promise<number[] | null> {
  const parts: any[] = [];

  if (input.text) {
    parts.push({ text: input.text });
  }

  if (input.fileBase64 && input.mimeType) {
    const supported = SUPPORTED_MIME[input.mimeType];
    if (supported) {
      parts.push({
        inlineData: {
          mimeType: supported,
          data: input.fileBase64,
        },
      });
    }
  }

  if (parts.length === 0) return null;

  const result = await genai.models.embedContent({
    model: "gemini-embedding-2-preview",
    contents: [{ parts }],
    config: {
      taskType: "RETRIEVAL_DOCUMENT",
      outputDimensionality: 768,
    },
  });

  return result.embeddings?.[0]?.values ?? null;
}

export async function embedQuery(text: string): Promise<number[] | null> {
  const result = await genai.models.embedContent({
    model: "gemini-embedding-2-preview",
    contents: [{ parts: [{ text }] }],
    config: {
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: 768,
    },
  });

  return result.embeddings?.[0]?.values ?? null;
}
