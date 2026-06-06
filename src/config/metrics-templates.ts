import type { OrgCategory } from "../types/api.js";

interface MetricTemplate {
  name: string;
  type: "count" | "percentage" | "currency" | "boolean";
  unit: string;
  is_kpi: boolean;
}

export const METRICS_BY_CATEGORY: Record<OrgCategory, MetricTemplate[]> = {
  salud: [
    { name: "Pacientes atendidos", type: "count", unit: "personas", is_kpi: true },
    { name: "Consultas realizadas", type: "count", unit: "consultas", is_kpi: true },
    { name: "Derivaciones", type: "count", unit: "derivaciones", is_kpi: false },
    { name: "Mamografías", type: "count", unit: "estudios", is_kpi: false },
    { name: "Ecografías", type: "count", unit: "estudios", is_kpi: false },
  ],
  alimentacion: [
    { name: "Familias atendidas", type: "count", unit: "familias", is_kpi: true },
    { name: "Raciones entregadas", type: "count", unit: "raciones", is_kpi: true },
    { name: "Kg de alimentos", type: "count", unit: "kg", is_kpi: true },
    { name: "Menores alimentados", type: "count", unit: "niños", is_kpi: false },
    { name: "Voluntarios activos", type: "count", unit: "personas", is_kpi: false },
  ],
  educacion: [
    { name: "Alumnos inscriptos", type: "count", unit: "alumnos", is_kpi: true },
    { name: "Talleres dictados", type: "count", unit: "talleres", is_kpi: true },
    { name: "Horas de formación", type: "count", unit: "horas", is_kpi: false },
    { name: "Tasa de finalización", type: "percentage", unit: "%", is_kpi: true },
    { name: "Becas otorgadas", type: "count", unit: "becas", is_kpi: false },
  ],
  legal: [
    { name: "Casos activos", type: "count", unit: "casos", is_kpi: true },
    { name: "Consultas jurídicas", type: "count", unit: "consultas", is_kpi: true },
    { name: "Casos resueltos", type: "count", unit: "casos", is_kpi: true },
    { name: "Patrocinios legales", type: "count", unit: "patrocinios", is_kpi: false },
    { name: "Incidencia en política pública", type: "count", unit: "acciones", is_kpi: false },
  ],
  derechos: [
    { name: "Personas asistidas", type: "count", unit: "personas", is_kpi: true },
    { name: "Denuncias acompañadas", type: "count", unit: "denuncias", is_kpi: true },
    { name: "Talleres de concientización", type: "count", unit: "talleres", is_kpi: false },
  ],
  discapacidad: [
    { name: "Beneficiarios activos", type: "count", unit: "personas", is_kpi: true },
    { name: "Sesiones de rehabilitación", type: "count", unit: "sesiones", is_kpi: true },
    { name: "Ayudas técnicas entregadas", type: "count", unit: "unidades", is_kpi: false },
  ],
  genero: [
    { name: "Mujeres asistidas", type: "count", unit: "mujeres", is_kpi: true },
    { name: "Refugios provistos", type: "count", unit: "plazas", is_kpi: true },
    { name: "Acompañamientos psicológicos", type: "count", unit: "sesiones", is_kpi: false },
  ],
  ambiental: [
    { name: "Árboles plantados", type: "count", unit: "árboles", is_kpi: true },
    { name: "Kg reciclados", type: "count", unit: "kg", is_kpi: true },
    { name: "Voluntarios en jornadas", type: "count", unit: "personas", is_kpi: false },
  ],
  social: [
    { name: "Familias asistidas", type: "count", unit: "familias", is_kpi: true },
    { name: "Actividades comunitarias", type: "count", unit: "actividades", is_kpi: true },
    { name: "Voluntarios activos", type: "count", unit: "personas", is_kpi: false },
  ],
  otro: [
    { name: "Beneficiarios directos", type: "count", unit: "personas", is_kpi: true },
    { name: "Actividades realizadas", type: "count", unit: "actividades", is_kpi: true },
  ],
};
