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

export interface Program {
  id: string;
  org_id: string;
  name: string;
  status: "active" | "paused" | "completed";
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  program_id: string;
  org_id: string;
  created_by: string;
  source: "whatsapp" | "web";
  description: string;
  activity_date: string;
  location: string | null;
  raw_data: Record<string, any> | null;
  created_at: string;
}

export interface BeneficiaryRecord {
  id: string;
  activity_id: string;
  org_id: string;
  count: number;
  segment: string;
  details: Record<string, any> | null;
  created_at: string;
}

export interface MetricsConfig {
  id: string;
  program_id: string;
  org_id: string;
  metric_name: string;
  metric_type: "count" | "percentage" | "currency" | "boolean";
  unit: string;
  is_kpi: boolean;
  created_at: string;
}

export interface MetricValue {
  id: string;
  activity_id: string;
  metric_config_id: string;
  org_id: string;
  value: number;
  period_date: string;
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

export interface Embedding {
  id: number;
  document_id: string;
  org_id: string;
  content: string;
  metadata: Record<string, any>;
  embedding: number[];
  created_at: string;
}

export interface Report {
  id: string;
  org_id: string;
  generated_by: string;
  title: string;
  report_type: "monthly" | "annual" | "donor" | "custom";
  format: "pdf" | "docx" | "json";
  storage_path: string;
  parameters: Record<string, any>;
  created_at: string;
}
