import { addDays, daysBetween, parseDay } from "@/lib/dates";
import type { DomainId, L } from "@/lib/types";

export interface Phase {
  id: string;
  title: L;
  focus: L;
  tasks: L[];
  domain?: DomainId;
  /** puntaje objetivo en simulacro al terminar la fase */
  target?: number;
  start: Date;
  end: Date;
}

const t = (es: string, en: string): L => ({ es, en });

/** Fases con su peso relativo en días */
const TEMPLATE: Omit<Phase, "start" | "end">[] = [
  {
    id: "p1",
    title: t("Fundamentos de la nube", "Cloud foundations"),
    focus: t("Dominio 1: beneficios, Well-Architected, migración y economía.", "Domain 1: benefits, Well-Architected, migration and economics."),
    tasks: [
      t("Completa las 4 lecciones de Conceptos", "Finish the 4 Concepts lessons"),
      t("Practica Conceptos en Fácil hasta 70%", "Practice Concepts at Easy until 70%"),
      t("Haz un mini simulacro como línea base", "Take a mini mock exam as a baseline"),
    ],
    domain: "concepts",
  },
  {
    id: "p2",
    title: t("Seguridad: responsabilidad e identidad", "Security: responsibility and identity"),
    focus: t("Modelo de responsabilidad compartida e IAM.", "Shared responsibility model and IAM."),
    tasks: [
      t("Lecciones de responsabilidad compartida e IAM", "Shared responsibility and IAM lessons"),
      t("Flashcards de seguridad hasta dominar 15", "Master 15 security flashcards"),
      t("Práctica de Seguridad en Medio", "Security practice at Medium"),
    ],
    domain: "security",
  },
  {
    id: "p3",
    title: t("Seguridad: gobierno y servicios", "Security: governance and services"),
    focus: t("CloudTrail, Config, Artifact, KMS, GuardDuty, WAF, Shield y más.", "CloudTrail, Config, Artifact, KMS, GuardDuty, WAF, Shield and more."),
    tasks: [
      t("Lecciones de gobierno y servicios de seguridad", "Governance and security services lessons"),
      t("Práctica de Seguridad en Avanzado", "Security practice at Advanced"),
    ],
    domain: "security",
    target: 650,
  },
  {
    id: "p4",
    title: t("Tecnología: infraestructura, cómputo y redes", "Technology: infrastructure, compute and networking"),
    focus: t("Regiones, AZ, EC2, Lambda, contenedores, VPC, Route 53, CloudFront.", "Regions, AZs, EC2, Lambda, containers, VPC, Route 53, CloudFront."),
    tasks: [
      t("Lecciones de acceso, infraestructura global, cómputo y redes", "Access, global infrastructure, compute and networking lessons"),
      t("Galería de servicios: repasa cómputo y redes", "Service gallery: review compute and networking"),
      t("Práctica de Tecnología en Medio", "Technology practice at Medium"),
    ],
    domain: "technology",
  },
  {
    id: "p5",
    title: t("Tecnología: datos, almacenamiento e IA", "Technology: data, storage and AI"),
    focus: t("S3 y sus clases, EBS, EFS, RDS, DynamoDB, Redshift, servicios de IA y analítica.", "S3 and its classes, EBS, EFS, RDS, DynamoDB, Redshift, AI and analytics services."),
    tasks: [
      t("Lecciones de almacenamiento, bases de datos, IA y otros", "Storage, database, AI and other lessons"),
      t("Práctica de Tecnología en Avanzado", "Technology practice at Advanced"),
      t("Primer simulacro completo de 65 preguntas", "First full 65-question mock exam"),
    ],
    domain: "technology",
    target: 720,
  },
  {
    id: "p6",
    title: t("Facturación, precios y soporte", "Billing, pricing and support"),
    focus: t("Modelos de precio, herramientas de costos y planes de soporte.", "Pricing models, cost tools and support plans."),
    tasks: [
      t("Lecciones de facturación y soporte", "Billing and support lessons"),
      t("Práctica de Facturación en todos los niveles", "Billing practice at every level"),
      t("Segundo simulacro completo", "Second full mock exam"),
    ],
    domain: "billing",
    target: 780,
  },
  {
    id: "p7",
    title: t("Repaso dirigido", "Targeted review"),
    focus: t("Solo tus errores y tu dominio más débil.", "Only your mistakes and weakest domain."),
    tasks: [
      t("Practica 'solo errores' cada día", "Practice 'mistakes only' every day"),
      t("Dos simulacros completos con al menos 2 días de separación", "Two full mock exams at least 2 days apart"),
    ],
    target: 850,
  },
  {
    id: "p8",
    title: t("Recta final", "Final stretch"),
    focus: t("Simulacro final, repaso ligero y descanso el día anterior.", "Final mock, light review and rest the day before."),
    tasks: [
      t("Último simulacro completo", "Last full mock exam"),
      t("Repasa flashcards, no temas nuevos", "Review flashcards, no new topics"),
      t("Descansa la noche previa y llega 30 minutos antes", "Rest the night before and arrive 30 minutes early"),
    ],
    target: 900,
  },
];

const WEIGHTS = [6, 6, 7, 7, 8, 6, 8, 4];

export function buildRoadmap(examDate: string, from: Date = new Date()): Phase[] {
  const exam = parseDay(examDate);
  const total = Math.max(daysBetween(from, exam), WEIGHTS.length);
  const sum = WEIGHTS.reduce((a, b) => a + b, 0);
  let cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return TEMPLATE.map((p, i) => {
    const len = i === TEMPLATE.length - 1
      ? Math.max(1, daysBetween(cursor, exam))
      : Math.max(1, Math.round((WEIGHTS[i] / sum) * total));
    const start = cursor;
    const end = addDays(cursor, len - 1);
    cursor = addDays(end, 1);
    return { ...p, start, end } as Phase;
  });
}

export function currentPhaseIndex(phases: Phase[], today: Date = new Date()): number {
  const i = phases.findIndex((p) => daysBetween(p.start, today) >= 0 && daysBetween(today, p.end) >= 0);
  if (i >= 0) return i;
  return daysBetween(today, phases[0].start) > 0 ? 0 : phases.length - 1;
}
