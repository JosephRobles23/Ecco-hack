import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface GenerateOptions {
  prompt: string;
  systemInstruction?: string;
  jsonMode?: boolean;
}

export async function generate(options: GenerateOptions): Promise<string> {
  const config: Record<string, any> = {};

  if (options.jsonMode) {
    config.responseMimeType = "application/json";
  }

  if (options.systemInstruction) {
    config.systemInstruction = options.systemInstruction;
  }

  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ parts: [{ text: options.prompt }] }],
    config,
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function generateWithMedia(options: {
  prompt: string;
  fileBase64: string;
  mimeType: string;
  jsonMode?: boolean;
}): Promise<string> {
  const config: Record<string, any> = {};

  if (options.jsonMode) {
    config.responseMimeType = "application/json";
  }

  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        parts: [
          { text: options.prompt },
          {
            inlineData: {
              mimeType: options.mimeType,
              data: options.fileBase64,
            },
          },
        ],
      },
    ],
    config,
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
