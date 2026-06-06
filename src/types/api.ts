// Shared API interfaces — used by all pipelines

// ============================================
// INGEST
// ============================================
export interface IngestRequest {
  message_id: string;
  org_id: string;
  sender_id: string;
  source: "whatsapp" | "web";
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
  extracted_data?: {
    activity?: {
      description: string;
      date: string;
      location?: string;
      program_id?: string;
    };
    beneficiaries?: {
      total: number;
      segments: Record<string, number>;
    };
    metrics?: Record<string, number>;
    entities?: Record<string, string>;
  };
  created_records?: {
    document_id: string;
    activity_id?: string;
    embedding_ids: string[];
  };
  error?: string;
}

// ============================================
// QUERY
// ============================================
export interface QueryRequest {
  message_id: string;
  org_id: string;
  sender_id: string;
  source: "whatsapp" | "web";
  message: string;
  conversation_id?: string;
  filters?: {
    program_id?: string;
    date_from?: string;
    date_to?: string;
    content_types?: string[];
  };
}

export interface QueryResponse {
  status: "ok" | "error";
  reply_message: string;
  reply_type: "text" | "document" | "chart_data";
  chart_data?: {
    type: "bar" | "line" | "pie" | "metric";
    title: string;
    data: Record<string, any>[];
    x_key?: string;
    y_key?: string;
  };
  sources?: {
    document_id: string;
    content_preview: string;
    content_type: string;
    similarity_score: number;
    storage_url?: string;
  }[];
  reply_file_url?: string;
  error?: string;
}

// ============================================
// REPORTS
// ============================================
export interface ReportGenerateRequest {
  org_id: string;
  requested_by: string;
  report_type: "monthly" | "annual" | "donor" | "custom";
  format: "pdf" | "docx" | "json";
  language: "es" | "en";
  parameters: {
    date_from: string;
    date_to: string;
    program_ids?: string[];
    include_beneficiary_details: boolean;
    donor_name?: string;
    template_id?: string;
  };
}

export interface ReportGenerateResponse {
  status: "ok" | "generating" | "error";
  report_id: string;
  file_url?: string;
  summary?: {
    title: string;
    period: string;
    total_activities: number;
    total_beneficiaries: number;
    key_metrics: Record<string, number>;
    highlights: string[];
  };
  error?: string;
}

// ============================================
// DASHBOARD
// ============================================
export interface DashboardResponse {
  org_id: string;
  org_name: string;
  org_category: string;
  period: string;
  kpis: {
    metric_name: string;
    value: number;
    unit: string;
    trend: "up" | "down" | "stable";
    trend_percent: number;
    is_primary: boolean;
  }[];
  charts: {
    id: string;
    type: "bar" | "line" | "pie" | "stacked_bar";
    title: string;
    data: Record<string, any>[];
    x_key: string;
    y_key: string;
    group_key?: string;
  }[];
  recent_activities: {
    id: string;
    description: string;
    date: string;
    source: "whatsapp" | "web";
    beneficiary_count: number;
    program_name: string;
  }[];
  ai_summary: string;
}

// ============================================
// ONBOARD
// ============================================
export interface OnboardRequest {
  org_name: string;
  category: OrgCategory;
  admin_email: string;
  admin_phone?: string;
  initial_programs?: {
    name: string;
    description?: string;
  }[];
}

export interface OnboardResponse {
  status: "ok" | "error";
  org_id: string;
  suggested_metrics: {
    metric_name: string;
    metric_type: string;
    unit: string;
    is_kpi: boolean;
  }[];
  whatsapp_welcome_message: string;
  whatsapp_number: string;
  error?: string;
}

// ============================================
// SHARED TYPES
// ============================================
export type OrgCategory =
  | "salud"
  | "educacion"
  | "alimentacion"
  | "legal"
  | "derechos"
  | "discapacidad"
  | "genero"
  | "ambiental"
  | "social"
  | "otro";

export type ContentType = "text" | "audio" | "image" | "pdf" | "excel" | "docx";
export type Source = "whatsapp" | "web";
