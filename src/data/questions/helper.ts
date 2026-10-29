import type { DomainId, Level, Question } from "@/lib/types";

/** [texto ES, texto EN, por qué ES, por qué EN] */
export type Opt = [string, string, string, string];

/**
 * Crea preguntas de forma compacta para un dominio.
 * Las preguntas son originales, escritas a partir de la guía oficial del examen CLF-C02.
 */
export const maker =
  (domain: DomainId) =>
  (
    id: string,
    level: Level,
    topic: string,
    qEs: string,
    qEn: string,
    opts: Opt[],
    answer: number | number[],
    explainEs: string,
    explainEn: string,
    services?: string[]
  ): Question => ({
    id,
    domain,
    level,
    topic,
    q: { es: qEs, en: qEn },
    options: opts.map(([es, en, wes, wen]) => ({ text: { es, en }, why: { es: wes, en: wen } })),
    answer: Array.isArray(answer) ? answer : [answer],
    explain: { es: explainEs, en: explainEn },
    services,
  });
