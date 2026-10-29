import { useMemo } from "react";
import { Link } from "react-router-dom";
import ActivityTerrain from "@/components/kokonutui/activity-terrain";
import SplitFlapText from "@/components/kokonutui/split-flap-text";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Gauge } from "@/components/watermelon-ui/gauge";
import { DOMAIN_BY_ID, DOMAINS } from "@/data/domains";
import { dailyLine } from "@/lib/coach";
import { dayKey, daysBetween, formatDate, parseDay } from "@/lib/dates";
import { useLang } from "@/lib/i18n";
import { PASS } from "@/lib/quiz";
import { buildRoadmap, currentPhaseIndex } from "@/lib/roadmap";
import { activitySeries, domainStats, estimatedScore, streak, todayCount, unlockedLevels, weakestDomain } from "@/lib/stats";
import { useStore } from "@/lib/store";
import type { L } from "@/lib/types";

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

interface NextStep {
  title: L;
  detail: L;
  to: string;
  cta: L;
}

export default function Dashboard() {
  const s = useStore();
  const { lang, x, tl } = useLang();
  const exam = parseDay(s.examDate);
  const daysLeft = daysBetween(new Date(), exam);
  const ds = useMemo(() => domainStats(s), [s]);
  const est = useMemo(() => estimatedScore(s), [s]);
  const st = streak(s.activity);
  const today = todayCount(s.activity);
  const phases = useMemo(() => buildRoadmap(s.examDate), [s.examDate]);
  const phase = phases[currentPhaseIndex(phases)];

  const next: NextStep = useMemo(() => {
    const dom = phase.domain ? DOMAIN_BY_ID[phase.domain] : DOMAIN_BY_ID[weakestDomain(ds).id];
    const pending = dom.lessons.find((l) => !s.lessonsDone[l.id]);
    const dstat = ds.find((d) => d.id === dom.id)!;
    if (pending)
      return {
        title: pending.title,
        detail: { es: `Lección de ${dom.short.es}. Unos 10 minutos de lectura.`, en: `${dom.short.en} lesson. About 10 minutes of reading.` },
        to: `/modules/${dom.id}`,
        cta: { es: "Estudiar la lección", en: "Study the lesson" },
      };
    if (dstat.attempted < 10)
      return {
        title: { es: `Practica ${dom.short.es} en nivel Fácil`, en: `Practice ${dom.short.en} at Easy level` },
        detail: { es: "10 preguntas con retroalimentación en cada respuesta.", en: "10 questions with feedback on every answer." },
        to: `/practice?domain=${dom.id}&level=easy&auto=1`,
        cta: { es: "Empezar práctica", en: "Start practice" },
      };
    if (s.exams.length === 0)
      return {
        title: { es: "Tu primer mini simulacro", en: "Your first mini mock exam" },
        detail: { es: "20 preguntas en 28 minutos para medir tu punto de partida.", en: "20 questions in 28 minutes to measure your starting point." },
        to: "/exam?kind=mini",
        cta: { es: "Hacer mini simulacro", en: "Take mini mock" },
      };
    const weak = weakestDomain(ds);
    const un = unlockedLevels(weak);
    const lvl = un.hard ? "hard" : un.medium ? "medium" : "easy";
    const wd = DOMAIN_BY_ID[weak.id];
    return {
      title: { es: `Refuerza ${wd.short.es}`, en: `Strengthen ${wd.short.en}` },
      detail: {
        es: `Es tu área con más margen de mejora y pesa ${wd.weight}% del examen.`,
        en: `It's your area with the most room to grow and weighs ${wd.weight}% of the exam.`,
      },
      to: `/practice?domain=${wd.id}&level=${lvl}&auto=1`,
      cta: { es: "Practicar ahora", en: "Practice now" },
    };
  }, [ds, phase, s.exams.length, s.lessonsDone]);

  const series = useMemo(() => activitySeries(s.activity, 16 * 7), [s.activity]);
  const lastExam = s.exams.at(-1);
  const hello = (() => {
    const h = new Date().getHours();
    const n = s.name ? `, ${s.name}` : "";
    if (h < 12) return x(`Buenos días${n}`, `Good morning${n}`);
    if (h < 19) return x(`Buenas tardes${n}`, `Good afternoon${n}`);
    return x(`Buenas noches${n}`, `Good evening${n}`);
  })();

  return (
    <div className="space-y-6">
      {/* Hero: la cuenta regresiva es el elemento protagonista */}
      <Panel className="relative overflow-hidden p-6 sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-center">
          <div>
            <p className="text-[15px] text-mist">{hello}</p>
            <div className="mt-5 flex items-end gap-5">
              <SplitFlapText
                className="font-display text-[88px] leading-none font-medium sm:text-[124px]"
                length={String(Math.max(daysLeft, 0)).length}
                text={String(Math.max(daysLeft, 0))}
                tileClassName="bg-plum-deep text-gilt-pale shadow-[inset_0_0_0_1px_rgba(240,208,96,0.18),0_18px_40px_-20px_rgba(0,0,0,0.9)]"
              />
              <div className="pb-3">
                <p className="font-display text-[30px] leading-tight sm:text-[36px]">
                  {x(daysLeft === 1 ? "día para tu examen" : "días para tu examen", daysLeft === 1 ? "day to your exam" : "days to your exam")}
                </p>
                <p className="mt-1 text-[14px] text-mist">
                  {cap(formatDate(exam, lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}
                </p>
              </div>
            </div>
            <p className="mt-8 max-w-[52ch] text-[16px] leading-relaxed text-ivory/90">
              {dailyLine(lang, st, today, s.dailyGoal, daysLeft)}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={next.to}>
                <Button size="lg">{tl(next.cta)}</Button>
              </Link>
              <Link to="/exam">
                <Button size="lg" variant="ghost">
                  {x("Ir a simulacros", "Go to mock exams")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative">
              <Gauge
                className={{ textClassName: "hidden" }}
                gapPercent={3}
                primary="#f0d060"
                secondary="rgba(239,231,214,0.10)"
                showValue={false}
                size={260}
                strokeWidth={5}
                thresholds={[{ value: 66.7, color: "#efe7d6" }]}
                value={est ? Math.round(((est - 100) / 900) * 100) : 0}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="numeral text-[64px] leading-none text-ivory">{est ?? "—"}</p>
                <p className="mt-2 max-w-[14ch] text-[13px] leading-snug text-mist">{x("puntaje estimado de 1000", "estimated score out of 1000")}</p>
              </div>
            </div>
            <p className="mt-4 max-w-[34ch] text-center text-[13px] leading-relaxed text-faint">
              {est === null
                ? x("Responde 10 preguntas para ver tu primera estimación.", "Answer 10 questions to see your first estimate.")
                : est >= PASS
                  ? x("Por encima de 700, la nota que aprueba. La marca blanca indica ese límite.", "Above 700, the passing mark. The white tick shows that line.")
                  : x(`Te faltan ${PASS - est} puntos para 700, la nota que aprueba.`, `${PASS - est} points short of 700, the passing mark.`)}
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="p-6">
          <p className="text-[13px] text-mist">{x("Meta de hoy", "Today's goal")}</p>
          <p className="numeral mt-3 text-[44px] leading-none">
            {Math.min(today, s.dailyGoal)}
            <span className="text-[24px] text-faint"> / {s.dailyGoal}</span>
          </p>
          <ProgressBar className="mt-5" label={x("Meta diaria", "Daily goal")} value={today / s.dailyGoal} />
          <p className="mt-4 text-[13px] text-mist">
            {x("Cada respuesta, flashcard o lección suma una actividad.", "Every answer, flashcard or lesson counts as one activity.")}
          </p>
        </Panel>

        <Panel className="p-6 lg:col-span-2">
          <p className="text-[13px] text-mist">{x("Tu siguiente paso", "Your next step")}</p>
          <h3 className="mt-3 text-[30px] leading-tight">{tl(next.title)}</h3>
          <p className="mt-2 text-[15px] text-ivory/80">{tl(next.detail)}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link to={next.to}>
              <Button>{tl(next.cta)}</Button>
            </Link>
            <Link className="text-[14px] text-gilt-pale underline-offset-4 hover:underline" to="/roadmap">
              {x("Fase actual: ", "Current phase: ")}
              {tl(phase.title)}
            </Link>
          </div>
        </Panel>
      </div>

      <Panel className="p-6 sm:p-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-[28px] leading-none">{x("Dominio por área del examen", "Mastery by exam domain")}</h2>
          <Link className="text-[14px] text-gilt-pale hover:underline" to="/modules">
            {x("Ver módulos", "View modules")}
          </Link>
        </div>
        <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          {DOMAINS.map((d) => {
            const st2 = ds.find((x2) => x2.id === d.id)!;
            return (
              <Link className="group block" key={d.id} to={`/modules/${d.id}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-display text-[21px] group-hover:text-gilt-pale">{tl(d.title)}</p>
                  <p className="numeral text-[15px] text-mist">
                    {x("pesa", "weighs")} {d.weight}%
                  </p>
                </div>
                <ProgressBar className="mt-3" label={tl(d.title)} value={st2.mastery} />
                <div className="mt-2 flex justify-between text-[12.5px] text-faint">
                  <span>
                    {Math.round(st2.mastery * 100)}% {x("dominado", "mastered")}
                  </span>
                  <span>
                    {st2.attempted
                      ? `${Math.round(st2.accuracy * 100)}% ${x("acierto reciente", "recent accuracy")}`
                      : x("sin práctica aún", "no practice yet")}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel className="overflow-hidden">
          <ActivityTerrain
            className="border-0 bg-transparent"
            data={series}
            endDate={dayKey()}
            labels={
              lang === "es"
                ? {
                    one: "actividad",
                    many: "actividades",
                    on: "el",
                    inLast: (t, w) => `${t} actividades en las últimas ${w} semanas`,
                    flat: "Plano",
                    terrain: "Relieve",
                    less: "Menos",
                    more: "Más",
                  }
                : undefined
            }
            locale={lang === "es" ? "es-PE" : "en-US"}
            title={x("Tu constancia", "Your consistency")}
          />
        </Panel>
        <Panel className="flex flex-col p-6">
          <p className="text-[13px] text-mist">{x("Último simulacro", "Last mock exam")}</p>
          {lastExam ? (
            <>
              <p className="numeral mt-3 text-[56px] leading-none text-ivory">{lastExam.score}</p>
              <p className="mt-2 text-[14px] text-mist">
                {lastExam.correct} / {lastExam.total} {x("correctas", "correct")},{" "}
                {formatDate(new Date(lastExam.at), lang, { day: "numeric", month: "long" })}
              </p>
              <ProgressBar className="mt-5" marker={(PASS - 100) / 900} value={(lastExam.score - 100) / 900} />
              <p className="mt-4 text-[14px] text-ivory/85">
                {lastExam.score >= PASS ? x("Aprobado en este intento.", "Passed on this attempt.") : x("Aún por debajo de 700.", "Still below 700.")}
              </p>
            </>
          ) : (
            <p className="mt-3 flex-1 text-[15px] leading-relaxed text-ivory/80">
              {x(
                "Todavía no hiciste ningún simulacro. Cuando completes uno, aquí verás tu puntaje y la tendencia.",
                "You haven't taken a mock exam yet. Once you finish one, your score and trend will show here."
              )}
            </p>
          )}
          <Link className="mt-auto pt-6" to="/exam">
            <Button className="w-full" variant="ghost">
              {lastExam ? x("Hacer otro simulacro", "Take another mock exam") : x("Empezar un simulacro", "Start a mock exam")}
            </Button>
          </Link>
        </Panel>
      </div>
    </div>
  );
}
