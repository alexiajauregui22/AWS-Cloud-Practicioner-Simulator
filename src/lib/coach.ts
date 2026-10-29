import { DOMAIN_BY_ID } from "@/data/domains";
import type { ExamResult } from "@/lib/store";
import type { DomainId, L, Lang } from "@/lib/types";

export interface CoachNote {
  headline: L;
  body: L;
  next: L;
}

const pct = (c: number, t: number) => (t ? Math.round((100 * c) / t) : 0);

function weakestOf(r: ExamResult): { id: DomainId; p: number } {
  const entries = (Object.entries(r.byDomain) as [DomainId, { c: number; t: number }][]).filter(([, v]) => v.t > 0);
  const sorted = entries
    .map(([id, v]) => ({ id, p: pct(v.c, v.t), w: DOMAIN_BY_ID[id].weight }))
    .sort((a, b) => a.p - b.p || b.w - a.w);
  return sorted[0] ?? { id: "security", p: 0 };
}

function strongestOf(r: ExamResult): { id: DomainId; p: number } {
  const entries = (Object.entries(r.byDomain) as [DomainId, { c: number; t: number }][]).filter(([, v]) => v.t > 0);
  return entries.map(([id, v]) => ({ id, p: pct(v.c, v.t) })).sort((a, b) => b.p - a.p)[0] ?? { id: "concepts", p: 0 };
}

/**
 * Retroalimentación después de un simulacro: reconoce el esfuerzo, dice la verdad
 * sobre el número y propone una acción concreta.
 */
export function examFeedback(r: ExamResult, prev: ExamResult | undefined, daysLeft: number): CoachNote {
  const weak = weakestOf(r);
  const strong = strongestOf(r);
  const wName = DOMAIN_BY_ID[weak.id].title;
  const sName = DOMAIN_BY_ID[strong.id].title;
  const delta = prev ? r.score - prev.score : null;
  const days: L = {
    es: daysLeft > 1 ? `Quedan ${daysLeft} días para tu examen.` : daysLeft === 1 ? "Tu examen es mañana." : "Hoy es tu examen.",
    en: daysLeft > 1 ? `${daysLeft} days until your exam.` : daysLeft === 1 ? "Your exam is tomorrow." : "Your exam is today.",
  };
  const trend: L =
    delta === null
      ? { es: "Este es tu primer simulacro: ahora tienes una línea base honesta.", en: "This is your first mock exam: you now have an honest baseline." }
      : delta > 0
        ? { es: `Subiste ${delta} puntos respecto al anterior. El estudio está funcionando.`, en: `You gained ${delta} points over the last one. The studying is working.` }
        : delta === 0
          ? { es: "Mismo puntaje que la vez anterior: es momento de cambiar de estrategia, no de repetir lo mismo.", en: "Same score as last time: time to change strategy, not repeat the same thing." }
          : { es: `Bajaste ${-delta} puntos. Es normal en cualquier preparación; revisa qué temas nuevos aparecieron.`, en: `You dropped ${-delta} points. It happens; check which new questions showed up.` };

  if (r.score >= 900) {
    return {
      headline: { es: `${r.score}. Estás listo para aprobar.`, en: `${r.score}. You're ready to pass.` },
      body: {
        es: `${trend.es} Dominas ${sName.es} con ${strong.p}%. ${days.es} Para acercarte a 1000, el margen está en ${wName.es} (${weak.p}%).`,
        en: `${trend.en} You've mastered ${sName.en} at ${strong.p}%. ${days.en} To get closer to 1000, the margin is in ${wName.en} (${weak.p}%).`,
      },
      next: {
        es: "Repasa solo tus errores de hoy y haz un simulacro más en 3 días para confirmar que el resultado es estable.",
        en: "Review only today's mistakes and take one more mock in 3 days to confirm the result is stable.",
      },
    };
  }
  if (r.score >= 750) {
    return {
      headline: { es: `${r.score}. Por encima de la nota de aprobación.`, en: `${r.score}. Above the passing mark.` },
      body: {
        es: `${trend.es} Con 700 apruebas, pero un margen de 100 puntos te protege de un mal día. ${days.es} Tu punto más débil es ${wName.es} con ${weak.p}%.`,
        en: `${trend.en} 700 passes, but a 100-point margin protects you from a bad day. ${days.en} Your weakest area is ${wName.en} at ${weak.p}%.`,
      },
      next: {
        es: `Haz dos prácticas de nivel Avanzado en ${wName.es} antes del próximo simulacro.`,
        en: `Do two Advanced practice sets in ${wName.en} before the next mock exam.`,
      },
    };
  }
  if (r.score >= 650) {
    return {
      headline: { es: `${r.score}. Estás cerca de la línea de 700.`, en: `${r.score}. You're close to the 700 line.` },
      body: {
        es: `${trend.es} Unas pocas respuestas más te ponen del lado aprobatorio; todavía no es seguro. ${days.es} ${wName.es} (${weak.p}%) es donde más puntos puedes ganar rápido.`,
        en: `${trend.en} A few more right answers put you on the passing side; it's not safe yet. ${days.en} ${wName.en} (${weak.p}%) is where you can gain points fastest.`,
      },
      next: {
        es: `Estudia la lección de ${wName.es}, repasa sus flashcards y haz una práctica de nivel Medio.`,
        en: `Study the ${wName.en} lesson, review its flashcards and do a Medium practice set.`,
      },
    };
  }
  return {
    headline: { es: `${r.score}. Hay trabajo por delante, y es un buen punto de partida.`, en: `${r.score}. There's work ahead, and it's a good starting point.` },
    body: {
      es: `${trend.es} Todavía faltan conceptos base, y eso se corrige estudiando lecciones antes de hacer más simulacros. ${days.es} Empieza por ${wName.es} (${weak.p}%), que pesa ${DOMAIN_BY_ID[weak.id].weight}% del examen.`,
      en: `${trend.en} Some core concepts are still missing, and that's fixed by studying lessons before more mock exams. ${days.en} Start with ${wName.en} (${weak.p}%), which is ${DOMAIN_BY_ID[weak.id].weight}% of the exam.`,
    },
    next: {
      es: "Completa las lecciones del módulo más débil y practica en nivel Fácil hasta llegar a 70% de acierto.",
      en: "Finish the weakest module's lessons and practice at Easy level until you reach 70% accuracy.",
    },
  };
}

export function practiceFeedback(correct: number, total: number): L {
  const p = pct(correct, total);
  if (p === 100) return { es: "Sesión perfecta. Sube un nivel la próxima vez.", en: "Perfect session. Move up a level next time." };
  if (p >= 80) return { es: `${p}% de acierto. Muy sólido; revisa las que fallaste y sigue.`, en: `${p}% correct. Very solid; review the misses and keep going.` };
  if (p >= 60) return { es: `${p}% de acierto. Vas bien, pero aún no es consistente. Lee las explicaciones de los errores.`, en: `${p}% correct. Good progress, not consistent yet. Read the explanations for your misses.` };
  return { es: `${p}% de acierto. Normal al empezar un tema: vuelve a la lección y repite esta práctica mañana.`, en: `${p}% correct. Normal when starting a topic: go back to the lesson and repeat this set tomorrow.` };
}

export function dailyLine(lang: Lang, streakDays: number, today: number, goal: number, daysLeft: number): string {
  const es = lang === "es";
  if (daysLeft < 0) return es ? "Tu fecha de examen ya pasó. Actualízala en Ajustes." : "Your exam date has passed. Update it in Settings.";
  if (today >= goal)
    return es
      ? `Meta diaria cumplida. ${streakDays} ${streakDays === 1 ? "día" : "días"} seguidos estudiando.`
      : `Daily goal met. ${streakDays} ${streakDays === 1 ? "day" : "days"} in a row.`;
  if (today > 0)
    return es ? `Llevas ${today} de ${goal} actividades hoy. Termina la meta para mantener tu racha.` : `${today} of ${goal} activities today. Finish the goal to keep your streak.`;
  if (streakDays > 0)
    return es ? `Racha de ${streakDays} ${streakDays === 1 ? "día" : "días"}. Una práctica corta hoy la mantiene viva.` : `${streakDays}-day streak. One short practice today keeps it alive.`;
  return es ? `Quedan ${daysLeft} días. Diez preguntas hoy son mejor que cincuenta el domingo.` : `${daysLeft} days left. Ten questions today beat fifty on Sunday.`;
}
