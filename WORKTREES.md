# Worktree Assignment — 3 Agentes Independientes

## Worktree A: Ingest Pipeline

**Branch:** `feature/ingest-pipeline`

**Archivos a implementar:**
- `src/routes/ingest.ts` — reemplazar stub con lógica real
- `src/langgraph/nodes/classifier.ts`
- `src/langgraph/nodes/embed-document.ts`
- `src/langgraph/nodes/extract-structured.ts`
- `src/langgraph/nodes/store-vector.ts`
- `src/langgraph/nodes/store-relational.ts`
- `src/langgraph/nodes/generate-reply.ts`
- `src/langgraph/pipelines/ingest-pipeline.ts`
- `src/lib/parsers/pdf-parser.ts`
- `src/lib/parsers/excel-parser.ts`
- `src/lib/parsers/docx-parser.ts`

**NO tocar:**
- `src/routes/query.ts`
- `src/routes/reports.ts`
- `src/langgraph/nodes/router.ts`
- `src/langgraph/nodes/retrieve.ts`
- `src/langgraph/nodes/generate.ts`
- `src/lib/reports/*`

**Testing:** Autosuficiente. Envía un request POST /api/ingest y verifica creación en Supabase.

**Env vars necesarias:** `GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Worktree B: Query Pipeline

**Branch:** `feature/query-pipeline`

**Archivos a implementar:**
- `src/routes/query.ts` — reemplazar stub con lógica real
- `src/langgraph/nodes/router.ts`
- `src/langgraph/nodes/retrieve.ts`
- `src/langgraph/nodes/generate.ts`
- `src/langgraph/nodes/clarify.ts`
- `src/langgraph/pipelines/query-pipeline.ts`
- `src/lib/supabase/vectors.ts`

**NO tocar:**
- `src/routes/ingest.ts`
- `src/routes/reports.ts`
- `src/langgraph/nodes/embed-document.ts`
- `src/langgraph/nodes/extract-structured.ts`
- `src/lib/parsers/*`
- `src/lib/reports/*`

**Testing:** Ejecutar `npm run seed:query` antes de testear. Esto crea datos mock en Supabase para que el RAG tenga embeddings contra los cuales buscar.

**Env vars necesarias:** `GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Worktree C: Reports + Dashboard + Onboard

**Branch:** `feature/reports-dashboard`

**Archivos a implementar:**
- `src/routes/reports.ts` — reemplazar stub con lógica real
- `src/langgraph/pipelines/report-pipeline.ts`
- `src/lib/reports/generator.ts`
- `src/lib/reports/templates.ts`
- `src/lib/reports/pdf-builder.ts`
- `src/config/metrics-templates.ts` — puede extender (no reescribir)

**NO tocar:**
- `src/routes/ingest.ts`
- `src/routes/query.ts`
- `src/langgraph/nodes/embed-document.ts`
- `src/langgraph/nodes/retrieve.ts`
- `src/lib/parsers/*`
- `src/lib/supabase/vectors.ts`

**Testing:** Ejecutar `npm run seed:reports` antes de testear. Esto crea actividades, métricas y beneficiarios mock para generar reportes y dashboards.

**Env vars necesarias:** `GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Archivos compartidos (NO MODIFICAR en worktrees)

Estos archivos ya están completos en `main`. Los 3 worktrees los usan como dependencia:

| Archivo | Propósito |
|---|---|
| `src/server.ts` | Entry point + registro de rutas |
| `src/langgraph/state.ts` | AgentState schema |
| `src/langgraph/graph.ts` | StateGraph base |
| `src/types/api.ts` | Interfaces de request/response |
| `src/types/database.ts` | Tipos de Supabase |
| `src/lib/supabase/client.ts` | Supabase client |
| `src/lib/gemini/embedding.ts` | Wrapper Gemini Embedding 2 |
| `src/lib/gemini/flash.ts` | Wrapper Gemini Flash |
| `src/config/prompts.ts` | System prompts |
| `package.json` | Dependencias |
| `tsconfig.json` | TypeScript config |

---

## Merge Strategy

Después de que los 3 worktrees terminen:

1. Merge A → main (sin conflictos, archivos nuevos)
2. Merge B → main (sin conflictos, archivos nuevos)
3. Merge C → main (sin conflictos, archivos nuevos)
4. Conectar los sub-grafos en `src/langgraph/graph.ts` (5 min de trabajo manual)

Los 3 seeds usan **UUIDs distintos** para org/user/program, así que pueden coexistir en la misma base de datos sin conflicto.
