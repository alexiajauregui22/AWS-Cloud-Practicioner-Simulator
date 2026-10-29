export type Lang = "es" | "en";

/** Texto bilingüe / bilingual text */
export interface L {
  es: string;
  en: string;
}

export type DomainId = "concepts" | "security" | "technology" | "billing";
export type Level = "easy" | "medium" | "hard";

export interface Option {
  text: L;
  /** Por qué esta opción es correcta o incorrecta */
  why: L;
}

export interface Question {
  id: string;
  domain: DomainId;
  level: Level;
  /** id del tema dentro del dominio */
  topic: string;
  q: L;
  options: Option[];
  /** índices correctos; más de uno = respuesta múltiple */
  answer: number[];
  explain: L;
  services?: string[];
}

export interface Flashcard {
  id: string;
  domain: DomainId;
  topic: string;
  front: L;
  back: L;
  service?: string;
}

export interface Lesson {
  id: string;
  title: L;
  summary: L;
  points: L[];
  services?: string[];
  /** Truco de examen / exam tip */
  tip?: L;
}

export interface Domain {
  id: DomainId;
  code: string;
  weight: number;
  title: L;
  short: L;
  description: L;
  lessons: Lesson[];
}

export interface Service {
  id: string;
  name: string;
  icon: string;
  category: ServiceCategory;
  what: L;
  when: L;
}

export type ServiceCategory =
  | "compute"
  | "storage"
  | "database"
  | "network"
  | "security"
  | "management"
  | "billing"
  | "ai"
  | "analytics"
  | "integration"
  | "migration"
  | "developer"
  | "enduser";
