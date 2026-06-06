/**
 * Seed for Worktree C (Reports + Dashboard) — independent testing.
 * Inserts a test org with activities, metrics, and beneficiary data so
 * reports/dashboard can be tested without running the ingest pipeline.
 *
 * Run: npm run seed:reports
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_ORG_ID = "00000000-0000-0000-0000-000000000002";
const TEST_USER_ID = "00000000-0000-0000-0000-000000000020";
const TEST_PROGRAM_ID = "00000000-0000-0000-0000-000000000200";

async function seed() {
  // 1. Organization
  await supabase.from("organizations").upsert({
    id: TEST_ORG_ID,
    name: "ONG Test - Programa Educativo",
    category: "educacion",
    description: "Organización de prueba para testing del reports pipeline",
  });

  // 2. User
  await supabase.from("users").upsert({
    id: TEST_USER_ID,
    org_id: TEST_ORG_ID,
    email: "test-reports@ong-test.org",
    role: "admin",
  });

  // 3. Program
  await supabase.from("programs").upsert({
    id: TEST_PROGRAM_ID,
    org_id: TEST_ORG_ID,
    name: "Talleres de Apoyo Escolar",
    status: "active",
    start_date: "2026-03-01",
  });

  // 4. Metrics config
  const metricsConfig = [
    { id: "00000000-0000-0000-0000-000000000301", metric_name: "Alumnos inscriptos", metric_type: "count", unit: "alumnos", is_kpi: true },
    { id: "00000000-0000-0000-0000-000000000302", metric_name: "Talleres dictados", metric_type: "count", unit: "talleres", is_kpi: true },
    { id: "00000000-0000-0000-0000-000000000303", metric_name: "Horas de formación", metric_type: "count", unit: "horas", is_kpi: false },
  ];

  await supabase.from("metrics_config").upsert(
    metricsConfig.map((m) => ({ ...m, program_id: TEST_PROGRAM_ID, org_id: TEST_ORG_ID }))
  );

  // 5. Activities (one per week in June 2026)
  const activities = [];
  for (let week = 1; week <= 4; week++) {
    const day = week * 7 > 28 ? 28 : week * 7;
    activities.push({
      id: `00000000-0000-0000-0000-00000000a${week.toString().padStart(3, "0")}`,
      program_id: TEST_PROGRAM_ID,
      org_id: TEST_ORG_ID,
      created_by: TEST_USER_ID,
      source: week % 2 === 0 ? "web" : "whatsapp",
      description: `Taller semana ${week} de junio — apoyo escolar primaria`,
      activity_date: `2026-06-${day.toString().padStart(2, "0")}`,
      location: "Centro Comunitario Barracas",
    });
  }

  await supabase.from("activities").upsert(activities);

  // 6. Beneficiary records
  const beneficiaries = activities.map((act, idx) => ({
    activity_id: act.id,
    org_id: TEST_ORG_ID,
    count: 20 + idx * 5,
    segment: "menores_12",
    details: { grade: "primaria", avg_age: 9 },
  }));

  await supabase.from("beneficiary_records").upsert(beneficiaries);

  // 7. Metric values
  const metricValues = activities.flatMap((act, idx) => [
    {
      activity_id: act.id,
      metric_config_id: metricsConfig[0].id,
      org_id: TEST_ORG_ID,
      value: 20 + idx * 5,
      period_date: act.activity_date,
    },
    {
      activity_id: act.id,
      metric_config_id: metricsConfig[1].id,
      org_id: TEST_ORG_ID,
      value: 2,
      period_date: act.activity_date,
    },
    {
      activity_id: act.id,
      metric_config_id: metricsConfig[2].id,
      org_id: TEST_ORG_ID,
      value: 4,
      period_date: act.activity_date,
    },
  ]);

  await supabase.from("metric_values").upsert(metricValues);

  console.log("✅ Reports pipeline seed complete");
  console.log(`   Org: ${TEST_ORG_ID}`);
  console.log(`   Activities: ${activities.length}`);
  console.log(`   Metric values: ${metricValues.length}`);
  console.log(`   Beneficiary records: ${beneficiaries.length}`);
}

seed().catch(console.error);
