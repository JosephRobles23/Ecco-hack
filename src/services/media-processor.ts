// Worktree B: Media Processing
// Downloads media from Kapso, parses files, uploads to Supabase Storage

import type { ProcessedMedia, ContentType } from "../types/api.js";

// TODO: Worktree B implements these functions

export async function downloadMedia(_mediaUrl: string): Promise<Buffer> {
  throw new Error("Not implemented — Worktree B");
}

export async function uploadToStorage(
  _buffer: Buffer,
  _orgId: string,
  _fileName: string
): Promise<{ url: string; path: string }> {
  throw new Error("Not implemented — Worktree B");
}

export async function processMedia(
  _mediaUrl: string,
  _mimeType: string,
  _fileName: string,
  _orgId: string
): Promise<ProcessedMedia> {
  throw new Error("Not implemented — Worktree B");
}

export function mimeToContentType(_mimeType: string): ContentType {
  throw new Error("Not implemented — Worktree B");
}
