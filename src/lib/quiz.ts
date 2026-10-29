import { DOMAINS } from "@/data/domains";
import { QUESTIONS } from "@/data/questions";
import { lastByQuestion } from "@/lib/stats";
import type { AppState } from "@/lib/store";
import type { DomainId, Level, Question } from "@/lib/types";
import { shuffle } from "@/lib/utils";

export interface Prepared {
  q: Question;
  /** orden en que se muestran las opciones (índices originales) */
  order: number[];
}

export const prepare = (q: Question): Prepared => ({ q, order: shuffle(q.options.map((_, i) => i)) });

/**
 * Elige preguntas al azar, priorizando las que nunca respondiste
 * y luego las que fallaste la última vez.
 */
export function pickPractice(
  s: AppState,
  opts: { domain?: DomainId | null; level?: Level | null; levels?: Level[]; count: number; onlyMistakes?: boolean }
): Prepared[] {
  const last = lastByQuestion(s.attempts);
  let pool = QUESTIONS.filter(
    (q) =>
      (!opts.domain || q.domain === opts.domain) &&
      (!opts.level || q.level === opts.level) &&
      (!opts.levels || opts.levels.includes(q.level))
  );
  if (opts.onlyMistakes) pool = pool.filter((q) => last.get(q.id)?.correct === false);
  const rank = (q: Question) => {
    const a = last.get(q.id);
    if (!a) return 0; // nueva
    if (!a.correct) return 1; // fallada
    return 2; // ya acertada
  };
  const buckets = [0, 1, 2].map((r) => shuffle(pool.filter((q) => rank(q) === r)));
  return buckets.flat().slice(0, opts.count).map(prepare);
}

const FULL = 65;
const MINI = 20;

/** Simulacro con la distribución oficial por dominio */
export function buildExam(kind: "full" | "mini"): Prepared[] {
  const total = kind === "full" ? FULL : MINI;
  const counts = DOMAINS.map((d) => Math.round((d.weight / 100) * total));
  // ajusta redondeo para sumar exactamente el total
  let diff = total - counts.reduce((a, b) => a + b, 0);
  let i = 2; // ajusta en Tecnología primero (dominio más grande)
  while (diff !== 0) {
    counts[i] += Math.sign(diff);
    diff -= Math.sign(diff);
    i = (i + 1) % counts.length;
  }
  const picked = DOMAINS.flatMap((d, idx) => {
    const qs = shuffle(QUESTIONS.filter((q) => q.domain === d.id));
    // mezcla de niveles parecida al examen: más medias que fáciles o difíciles
    return qs.slice(0, counts[idx]);
  });
  return shuffle(picked).map(prepare);
}

export const examMinutes = (kind: "full" | "mini") => (kind === "full" ? 90 : 28);

export function isCorrect(q: Question, chosen: number[]) {
  if (chosen.length !== q.answer.length) return false;
  return q.answer.every((a) => chosen.includes(a));
}

/** Puntaje aproximado en escala 100-1000 */
export const scaledScore = (correct: number, total: number) =>
  total === 0 ? 100 : Math.round(100 + (900 * correct) / total);

export const PASS = 700;
