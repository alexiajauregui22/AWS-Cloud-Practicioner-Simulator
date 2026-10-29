import { DOMAINS } from "@/data/domains";
import { QUESTIONS } from "@/data/questions";
import { addDays, dayKey } from "@/lib/dates";
import type { AppState, Attempt } from "@/lib/store";
import type { DomainId, Level } from "@/lib/types";

export const LEVELS: Level[] = ["easy", "medium", "hard"];

/** Última respuesta por pregunta */
export function lastByQuestion(attempts: Attempt[]): Map<string, Attempt> {
  const m = new Map<string, Attempt>();
  for (const a of attempts) m.set(a.qid, a);
  return m;
}

/** Precisión reciente con suavizado: con pocos datos tiende a 50% en lugar de saltar a 0 o 100 */
export function smoothedAccuracy(list: Attempt[], window = 40): { acc: number; n: number } {
  const recent = list.slice(-window);
  const n = recent.length;
  const c = recent.filter((a) => a.correct).length;
  return { acc: n === 0 ? 0 : (c + 1) / (n + 2), n };
}

export interface DomainStats {
  id: DomainId;
  weight: number;
  attempted: number;
  accuracy: number; // 0..1
  mastery: number; // 0..1, preguntas cuya última respuesta fue correcta
  byLevel: Record<Level, { c: number; t: number }>;
}

export function domainStats(s: AppState): DomainStats[] {
  const last = lastByQuestion(s.attempts);
  return DOMAINS.map((d) => {
    const qs = QUESTIONS.filter((q) => q.domain === d.id);
    const list = s.attempts.filter((a) => a.domain === d.id);
    const byLevel = { easy: { c: 0, t: 0 }, medium: { c: 0, t: 0 }, hard: { c: 0, t: 0 } };
    for (const a of list) {
      byLevel[a.level].t++;
      if (a.correct) byLevel[a.level].c++;
    }
    const mastered = qs.filter((q) => last.get(q.id)?.correct).length;
    return {
      id: d.id,
      weight: d.weight,
      attempted: list.length,
      accuracy: smoothedAccuracy(list).acc,
      mastery: qs.length ? mastered / qs.length : 0,
      byLevel,
    };
  });
}

/**
 * Puntaje estimado en la escala 100-1000.
 * Combina la precisión reciente ponderada por dominio con el último simulacro.
 * Es una estimación: AWS usa un modelo de puntaje escalado que no publica.
 */
export function estimatedScore(s: AppState): number | null {
  const ds = domainStats(s);
  const total = ds.reduce((n, d) => n + d.attempted, 0);
  const lastExam = s.exams.at(-1);
  if (total < 10 && !lastExam) return null;
  const weighted = ds.reduce((sum, d) => sum + (d.weight / 100) * (d.attempted ? d.accuracy : 0.25), 0);
  let score = 100 + 900 * weighted;
  if (lastExam) score = score * 0.5 + lastExam.score * 0.5;
  return Math.round(score);
}

export function streak(activity: Record<string, number>): number {
  let d = new Date();
  if (!activity[dayKey(d)]) d = addDays(d, -1);
  let n = 0;
  while (activity[dayKey(d)]) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function todayCount(activity: Record<string, number>) {
  return activity[dayKey()] ?? 0;
}

/** Serie de los últimos N días, del más antiguo al más reciente */
export function activitySeries(activity: Record<string, number>, days: number): number[] {
  const out: number[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) out.push(activity[dayKey(addDays(today, -i))] ?? 0);
  return out;
}

/** Un nivel se desbloquea con 70% de acierto en el nivel anterior (mínimo 6 respuestas) */
export function unlockedLevels(stats: DomainStats): Record<Level, boolean> {
  const ok = (l: Level) => stats.byLevel[l].t >= 6 && stats.byLevel[l].c / stats.byLevel[l].t >= 0.7;
  return { easy: true, medium: ok("easy"), hard: ok("medium") };
}

export function weakestDomain(ds: DomainStats[]): DomainStats {
  // prioriza dominios con peso alto y precisión baja
  const need = (d: DomainStats) => d.weight * (1 - (d.attempted ? d.accuracy : 0));
  return [...ds].sort((a, b) => need(b) - need(a))[0];
}

export const level = (xp: number) => {
  const lv = Math.floor(Math.sqrt(xp / 60)) + 1;
  const base = (lv - 1) ** 2 * 60;
  const next = lv ** 2 * 60;
  return { lv, progress: (xp - base) / (next - base), next };
};
