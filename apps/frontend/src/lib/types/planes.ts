export type MateriaTipo = "regular" | "life" | "semana_tec";

export type Materia = {
  clave: string;
  nombre: string;
  creditos: number;
  tipo: MateriaTipo;
};

export type Semestre = {
  numero: number;
  materias: Materia[];
};

export type PlanEstudio = {
  carreraClave: string;
  nombre: string;
  data: {
    semestres: Semestre[];
  };
};

export type CarreraSummary = {
  carreraClave: string;
  nombre: string;
};

export type Modelo = "tec21" | "clasico";

export type ProfileSetupBody = {
  matricula: string;
  nombre: string;
  carreraClave: string;
  modelo: Modelo;
  semestre: number;
  materias: Array<Pick<Materia, "clave" | "nombre" | "creditos">>;
  canvasIcalUrl?: string;
};
