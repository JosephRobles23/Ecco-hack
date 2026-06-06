/**
 * Seed for Worktree B (Query Pipeline) — independent testing.
 * Inserts a test org, documents, and pre-computed embeddings so
 * the query pipeline can be tested without running the ingest pipeline.
 *
 * Run: npm run seed:query
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_ORG_ID = "00000000-0000-0000-0000-000000000001";
const TEST_USER_ID = "00000000-0000-0000-0000-000000000010";
const TEST_PROGRAM_ID = "00000000-0000-0000-0000-000000000100";

async function seed() {
  // 1. Organization
  await supabase.from("organizations").upsert({
    id: TEST_ORG_ID,
    name: "ONG Test - Comedor Comunitario",
    category: "alimentacion",
    description: "Organización de prueba para testing del query pipeline",
  });

  // 2. User
  await supabase.from("users").upsert({
    id: TEST_USER_ID,
    org_id: TEST_ORG_ID,
    email: "test@ong-test.org",
    phone: "+5491100000000",
    role: "admin",
  });

  // 3. Program
  await supabase.from("programs").upsert({
    id: TEST_PROGRAM_ID,
    org_id: TEST_ORG_ID,
    name: "Comedor Villa 31",
    status: "active",
    start_date: "2026-01-01",
  });

  // 4. Documents with fake embeddings (768-dim zero vectors for structure testing)
  const docs = [
    {
      id: "00000000-0000-0000-0000-000000001001",
      org_id: TEST_ORG_ID,
      uploaded_by: TEST_USER_ID,
      source: "whatsapp",
      content_type: "audio",
      storage_path: "originals/test/audio1.ogg",
      storage_url: "https://example.com/audio1.ogg",
      mime_type: "audio/ogg",
      file_size: 24000,
      extracted_text: "Hoy atendimos 47 familias en el comedor de Villa 31, 12 menores de 5 años",
      processing_status: "done",
    },
    {
      id: "00000000-0000-0000-0000-000000001002",
      org_id: TEST_ORG_ID,
      uploaded_by: TEST_USER_ID,
      source: "web",
      content_type: "text",
      storage_path: "originals/test/nota.txt",
      storage_url: "https://example.com/nota.txt",
      mime_type: "text/plain",
      file_size: 500,
      extracted_text: "Informe semanal: se entregaron 250 kg de alimentos a 85 familias entre lunes y viernes",
      processing_status: "done",
    },
    {
      id: "00000000-0000-0000-0000-000000001003",
      org_id: TEST_ORG_ID,
      uploaded_by: TEST_USER_ID,
      source: "whatsapp",
      content_type: "image",
      storage_path: "originals/test/planilla.jpg",
      storage_url: "https://example.com/planilla.jpg",
      mime_type: "image/jpeg",
      file_size: 150000,
      extracted_text: "Planilla de asistencia: 35 adultos, 22 menores, total 57 personas. Sede Barracas.",
      processing_status: "done",
    },
  ];

  await supabase.from("documents").upsert(docs);

  // 5. Embeddings (using random-ish vectors for similarity testing)
  const makeVector = (seed: number) =>
    Array.from({ length: 768 }, (_, i) => Math.sin(seed * (i + 1) * 0.01));

  const embeddings = docs.map((doc, idx) => ({
    document_id: doc.id,
    org_id: TEST_ORG_ID,
    content: doc.extracted_text,
    metadata: { source: doc.source, content_type: doc.content_type },
    embedding: JSON.stringify(makeVector(idx + 1)),
  }));

  await supabase.from("embeddings").upsert(embeddings);

  console.log("✅ Query pipeline seed complete");
  console.log(`   Org: ${TEST_ORG_ID}`);
  console.log(`   Documents: ${docs.length}`);
  console.log(`   Embeddings: ${embeddings.length}`);
}

seed().catch(console.error);
