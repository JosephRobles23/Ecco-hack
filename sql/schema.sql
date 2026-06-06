-- ============================================
-- Supabase Schema — NGO Impact Platform
-- Run this ONCE in Supabase SQL Editor
-- ============================================

CREATE EXTENSION IF NOT EXISTS vector;

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('salud','educacion','alimentacion','legal','derechos','discapacidad','genero','ambiental','social','otro')),
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin','operator','viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Programs
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES users(id),
  source TEXT NOT NULL CHECK (source IN ('whatsapp','web')),
  description TEXT NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  location TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Beneficiary Records
CREATE TABLE beneficiary_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  count INT NOT NULL DEFAULT 0,
  segment TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metrics Config
CREATE TABLE metrics_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('count','percentage','currency','boolean')),
  unit TEXT NOT NULL,
  is_kpi BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metric Values
CREATE TABLE metric_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  metric_config_id UUID REFERENCES metrics_config(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  value FLOAT NOT NULL,
  period_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  source TEXT NOT NULL CHECK (source IN ('whatsapp','web')),
  content_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  original_filename TEXT,
  mime_type TEXT NOT NULL,
  file_size INT NOT NULL DEFAULT 0,
  extracted_text TEXT,
  extracted_data JSONB,
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending','processing','done','error')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Embeddings (pgvector)
CREATE TABLE embeddings (
  id BIGSERIAL PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(768) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  generated_by UUID REFERENCES users(id),
  title TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('monthly','annual','donor','custom')),
  format TEXT NOT NULL CHECK (format IN ('pdf','docx','json')),
  storage_path TEXT,
  parameters JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RPC: Semantic search function
-- ============================================
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(768),
  target_org_id UUID,
  match_threshold FLOAT DEFAULT 0.65,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id BIGINT,
  document_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    embeddings.id,
    embeddings.document_id,
    embeddings.content,
    embeddings.metadata,
    1 - (embeddings.embedding <=> query_embedding) AS similarity
  FROM embeddings
  WHERE
    embeddings.org_id = target_org_id
    AND 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY embeddings.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, so backend works without policies for now.
-- Frontend policies (using auth.jwt()) should be added per-table as needed.
