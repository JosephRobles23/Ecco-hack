// ============================================
// KAPSO WEBHOOK TYPES — incoming from Kapso
// ============================================
export interface KapsoWebhookPayload {
  message: KapsoMessage;
  conversation: KapsoConversation;
  is_new_conversation: boolean;
  phone_number_id: string;
}

export interface KapsoMessage {
  id: string;
  timestamp: string;
  type: KapsoMessageType;
  from: string;
  text?: { body: string };
  image?: { caption?: string; id: string };
  video?: { caption?: string; id: string };
  audio?: { id: string };
  document?: { caption?: string; filename?: string; id: string };
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  interactive?: {
    type: "button_reply" | "list_reply";
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
  reaction?: { message_id: string; emoji: string };
  contacts?: any[];
  kapso: KapsoMeta;
}

export interface KapsoMeta {
  direction: "inbound" | "outbound";
  status: "received" | "sent" | "delivered" | "read" | "failed";
  processing_status: "pending" | "completed";
  origin: "cloud_api" | "business_app" | "history_sync";
  has_media: boolean;
  content: string;
  media_url?: string;
  media_data?: {
    url: string;
    filename: string;
    content_type: string;
    byte_size: number;
  };
  transcript?: { text: string };
  message_type_data?: Record<string, any>;
}

export interface KapsoConversation {
  id: string;
  phone_number: string;
  status: "active" | "ended";
  last_active_at: string;
  created_at: string;
  phone_number_id: string;
  kapso: {
    contact_name: string;
    messages_count: number;
    last_message_text: string;
    last_inbound_at?: string;
  };
}

export type KapsoMessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "location"
  | "interactive"
  | "reaction"
  | "contacts";

// ============================================
// BACKEND IA TYPES — requests to hakelton
// ============================================
export interface IngestRequest {
  message_id: string;
  org_id: string;
  sender_id: string;
  source: "whatsapp";
  timestamp: string;
  content_type: "text" | "audio" | "image" | "pdf" | "excel" | "docx";
  text_content: string | null;
  file?: {
    storage_url: string;
    storage_path: string;
    mime_type: string;
    file_name: string;
    file_size: number;
    file_base64?: string;
  };
  preprocessed?: {
    extracted_text?: string;
    excel_json?: Record<string, any>[];
  };
  conversation_id?: string;
}

export interface IngestResponse {
  status: "ok" | "error" | "processing";
  reply_message: string;
  reply_type: "text" | "document";
  reply_file_url?: string;
  error?: string;
}

export interface QueryRequest {
  message_id: string;
  org_id: string;
  sender_id: string;
  source: "whatsapp";
  message: string;
  conversation_id?: string;
}

export interface QueryResponse {
  status: "ok" | "error";
  reply_message: string;
  reply_type: "text" | "document" | "chart_data";
  reply_file_url?: string;
  error?: string;
}

// ============================================
// INTERNAL TYPES
// ============================================
export type ContentType = "text" | "audio" | "image" | "pdf" | "excel" | "docx";

export interface ProcessedMedia {
  storage_url: string;
  storage_path: string;
  mime_type: string;
  file_name: string;
  file_size: number;
  file_base64: string;
  content_type: ContentType;
  extracted_text?: string;
  excel_json?: Record<string, any>[];
}
