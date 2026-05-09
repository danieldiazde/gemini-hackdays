import type { CarreraSummary, PlanEstudio } from "@/lib/types/planes";

/**
 * Static fallback for the carrera dropdown / materias list while Persona A's
 * `/api/planes` endpoints are being built. Keep the shapes in sync with
 * `lib/types/planes.ts` so swapping in real data is a no-op.
 */

export const CARRERAS_FIXTURE: CarreraSummary[] = [
  { carreraClave: "ITC", nombre: "Ingeniería en Tecnologías Computacionales" },
  { carreraClave: "IMT", nombre: "Ingeniería en Mecatrónica" },
  { carreraClave: "INA", nombre: "Ingeniería en Innovación y Desarrollo" },
  { carreraClave: "LRI", nombre: "Licenciatura en Relaciones Internacionales" },
];

const ITC_PLAN: PlanEstudio = {
  carreraClave: "ITC",
  nombre: "Ingeniería en Tecnologías Computacionales",
  data: {
    semestres: [
      {
        numero: 1,
        materias: [
          { clave: "TC1001", nombre: "Pensamiento computacional", creditos: 8, tipo: "regular" },
          { clave: "MA1001", nombre: "Modelación matemática", creditos: 8, tipo: "regular" },
          { clave: "F1001", nombre: "Exploración del campo profesional", creditos: 4, tipo: "regular" },
          { clave: "VI1001", nombre: "Iniciativa universitaria", creditos: 4, tipo: "life" },
        ],
      },
      {
        numero: 5,
        materias: [
          { clave: "TC2025", nombre: "Compiladores", creditos: 8, tipo: "regular" },
          { clave: "TC2018", nombre: "Bases de datos II", creditos: 8, tipo: "regular" },
          { clave: "TC2042", nombre: "Sistemas operativos", creditos: 8, tipo: "regular" },
          { clave: "ET1011", nombre: "Ética y ciudadanía", creditos: 4, tipo: "regular" },
          { clave: "ST5001", nombre: "Semana Tec: Innovación abierta", creditos: 2, tipo: "semana_tec" },
        ],
      },
      {
        numero: 6,
        materias: [
          { clave: "TC3045", nombre: "Estructuras de datos avanzadas", creditos: 8, tipo: "regular" },
          { clave: "TC3050", nombre: "Inteligencia artificial", creditos: 8, tipo: "regular" },
          { clave: "TC3060", nombre: "Computación distribuida", creditos: 8, tipo: "regular" },
          { clave: "VI2002", nombre: "Compromiso social", creditos: 4, tipo: "life" },
        ],
      },
    ],
  },
};

const IMT_PLAN: PlanEstudio = {
  carreraClave: "IMT",
  nombre: "Ingeniería en Mecatrónica",
  data: {
    semestres: [
      {
        numero: 5,
        materias: [
          { clave: "MR2010", nombre: "Sistemas de control", creditos: 8, tipo: "regular" },
          { clave: "MR2020", nombre: "Robótica industrial", creditos: 8, tipo: "regular" },
          { clave: "MR2030", nombre: "Diseño de máquinas", creditos: 8, tipo: "regular" },
          { clave: "ET1011", nombre: "Ética y ciudadanía", creditos: 4, tipo: "regular" },
        ],
      },
    ],
  },
};

const INA_PLAN: PlanEstudio = {
  carreraClave: "INA",
  nombre: "Ingeniería en Innovación y Desarrollo",
  data: {
    semestres: [
      {
        numero: 5,
        materias: [
          { clave: "IN2010", nombre: "Diseño de productos", creditos: 8, tipo: "regular" },
          { clave: "IN2020", nombre: "Modelos de negocio", creditos: 8, tipo: "regular" },
          { clave: "IN2030", nombre: "Innovación tecnológica", creditos: 8, tipo: "regular" },
        ],
      },
    ],
  },
};

const LRI_PLAN: PlanEstudio = {
  carreraClave: "LRI",
  nombre: "Licenciatura en Relaciones Internacionales",
  data: {
    semestres: [
      {
        numero: 5,
        materias: [
          { clave: "RI2010", nombre: "Política internacional", creditos: 8, tipo: "regular" },
          { clave: "RI2020", nombre: "Derecho internacional", creditos: 8, tipo: "regular" },
          { clave: "RI2030", nombre: "Comercio global", creditos: 8, tipo: "regular" },
        ],
      },
    ],
  },
};

export const PLANES_FIXTURE: Record<string, PlanEstudio> = {
  ITC: ITC_PLAN,
  IMT: IMT_PLAN,
  INA: INA_PLAN,
  LRI: LRI_PLAN,
};

export function getFixturePlan(carreraClave: string): PlanEstudio | undefined {
  return PLANES_FIXTURE[carreraClave];
}
