import type { CarreraSummary, PlanEstudio } from "@/lib/types/planes";

/**
 * Static fallback for demo mode and local development without Supabase data.
 */

export const CARRERAS_FIXTURE: CarreraSummary[] = [
  { carreraClave: "ARQ",   nombre: "Arquitectura" },
  { carreraClave: "IBI",   nombre: "Ingeniería Biomédica" },
  { carreraClave: "IC",    nombre: "Ingeniería Civil" },
  { carreraClave: "IAL",   nombre: "Ingeniería en Alimentos" },
  { carreraClave: "IBA",   nombre: "Ingeniería en Biosistemas Agroalimentarios" },
  { carreraClave: "IBT",   nombre: "Ingeniería en Biotecnología" },
  { carreraClave: "IDS",   nombre: "Ingeniería en Desarrollo Sustentable" },
  { carreraClave: "IE",    nombre: "Ingeniería en Electrónica y Semiconductores" },
  { carreraClave: "IFI",   nombre: "Ingeniería en Física Industrial" },
  { carreraClave: "IID",   nombre: "Ingeniería en Innovación y Desarrollo" },
  { carreraClave: "IIS",   nombre: "Ingeniería Industrial y de Sistemas" },
  { carreraClave: "IM",    nombre: "Ingeniería Mecánica" },
  { carreraClave: "IMT",   nombre: "Ingeniería Mecatrónica" },
  { carreraClave: "IQ",    nombre: "Ingeniería Química" },
  { carreraClave: "IDM",   nombre: "Ingeniería en Inteligencia Artificial y Ciencia de Datos" },
  { carreraClave: "INM",   nombre: "Ingeniería en Nanotecnología y Materiales" },
  { carreraClave: "IRS",   nombre: "Ingeniería en Robótica y Sistemas Inteligentes" },
  { carreraClave: "ITC",   nombre: "Ingeniería en Tecnologías Computacionales" },
  { carreraClave: "ITDN",  nombre: "Ingeniería en Transformación Digital de Negocios" },
  { carreraClave: "LAD",   nombre: "Licenciatura en Arte Digital" },
  { carreraClave: "LBC",   nombre: "Licenciatura en Biociencias" },
  { carreraClave: "LCPD",  nombre: "Licenciatura en Comunicación y Producción Digital" },
  { carreraClave: "LCPF",  nombre: "Licenciatura en Contaduría Pública y Finanzas" },
  { carreraClave: "LED",   nombre: "Licenciatura en Derecho" },
  { carreraClave: "LDTCO", nombre: "Licenciatura en Desarrollo de Talento y Cultura Organizacional" },
  { carreraClave: "LDI",   nombre: "Licenciatura en Diseño" },
  { carreraClave: "LEC",   nombre: "Licenciatura en Economía" },
  { carreraClave: "LEI",   nombre: "Licenciatura en Emprendimiento e Innovación" },
  { carreraClave: "LETN",  nombre: "Licenciatura en Estrategia y Transformación de Negocios" },
  { carreraClave: "LFIN",  nombre: "Licenciatura en Finanzas" },
  { carreraClave: "LGTP",  nombre: "Licenciatura en Gobierno y Transformación Pública" },
  { carreraClave: "LITE",  nombre: "Licenciatura en Innovación y Transformación Educativa" },
  { carreraClave: "LIN",   nombre: "Licenciatura en Inteligencia de Negocios" },
  { carreraClave: "LLEE",  nombre: "Licenciatura en Letras y Emprendimiento Editorial" },
  { carreraClave: "LMKT",  nombre: "Licenciatura en Mercadotecnia" },
  { carreraClave: "LNI",   nombre: "Licenciatura en Negocios Internacionales" },
  { carreraClave: "LNBI",  nombre: "Licenciatura en Nutrición y Bienestar Integral" },
  { carreraClave: "LPCS",  nombre: "Licenciatura en Psicología Clínica y de la Salud" },
  { carreraClave: "LRI",   nombre: "Licenciatura en Relaciones Internacionales" },
  { carreraClave: "LTPM",  nombre: "Licenciatura en Tecnología y Producción Musical" },
  { carreraClave: "LUB",   nombre: "Licenciatura en Urbanismo" },
  { carreraClave: "MC",    nombre: "Médico Cirujano" },
  { carreraClave: "MCO",   nombre: "Médico Cirujano Odontólogo" },
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
