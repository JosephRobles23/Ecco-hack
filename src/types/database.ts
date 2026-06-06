export interface Organization {
  id: string;
  name: string;
  category: string;
  description: string | null;
  settings: Record<string, any> | null;
  created_at: string;
}

export interface User {
  id: string;
  org_id: string;
  email: string;
  phone: string | null;
  role: "admin" | "operator" | "viewer";
  created_at: string;
}

export interface Document {
  id: string;
  org_id: string;
  uploaded_by: string;
  source: "whatsapp" | "web";
  content_type: string;
  storage_path: string;
  storage_url: string;
  original_filename: string | null;
  mime_type: string;
  file_size: number;
  extracted_text: string | null;
  extracted_data: Record<string, any> | null;
  processing_status: "pending" | "processing" | "done" | "error";
  created_at: string;
}

export interface ConversationSession {
  id: string;
  org_id: string;
  phone_number: string;
  kapso_conversation_id: string;
  user_id: string | null;
  status: "active" | "ended";
  last_active_at: string;
  created_at: string;
}
