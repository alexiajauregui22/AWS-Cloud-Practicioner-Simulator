import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { daysBetween, formatDate, parseDay } from "@/lib/dates";
import { useLang } from "@/lib/i18n";
import { buildRoadmap, currentPhaseIndex } from "@/lib/roadmap";
import { estimatedScore } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function Roadmap() {
  const s = useStore();
  const { x, tl, lang } = useLang();
  const phases = useMemo(() => buildRoadmap(s.examDate), [s.examDate]);
  const cur = currentPhaseIndex(phases);
  const exam = parseDay(s.examDate);
  const left = daysBetween(new Date(), exam);
  const est = estimatedScore(s);
  const best = s.exams.reduce((m, e) => Math.max(m, e.score), 0);

  return (
    <div>
      <header className="mb-10 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div className="max-w-[60ch]">
          <h1 className="text-[44px] leading-[1.05] sm:text-[56px]">{x("Tu roadmap al examen", "Your roadmap to the exam")}</h1>
          <p className="mt-4 text-[16px] leading-relaxed text-mist">
            {x(
              "Ocho fases repartidas entre hoy y tu fecha de examen. Si cambias la fecha en Ajustes, el plan se recalcula solo.",
              "Eight phases spread between today and your exam date. If you change the date in Settings, the plan recalculates itself."
            )}
          </p>
        </div>
        <Panel className="p-6">
          <p className="text-[13px] text-mist">{x("Fecha del examen", "Exam date")}</p>
          <p className="mt-1 font-display text-[28px] first-letter:uppercase">
            {formatDate(exam, lang, { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p className="mt-3 text-[14px] text-ivory/85">
            {left > 0 ? x(`Faltan ${left} días.`, `${left} days to go.`) : x("La fecha ya llegó.", "The date has arrived.")}{" "}
            {x("Mejor simulacro:", "Best mock exam:")} <span className="numeral text-gilt-pale">{best || "—"}</span>
            {", "}
            {x("estimado actual:", "current estimate:")} <span className="numeral text-gilt-pale">{est ?? "—"}</span>
          </p>
        </Panel>
      </header>

      <Panel className="mb-10 p-6 sm:p-7" tone="inset">
        <p className="max-w-[78ch] text-[15px] leading-relaxed text-ivory/85">
          {x(
            "Sobre la meta de 1000: es el puntaje perfecto y una buena brújula, pero el examen aprueba con 700. Este plan busca que llegues sostenidamente a 850 o más en simulacros, que es el margen que te protege de preguntas nuevas o de un mal día.",
            "About the 1000 goal: it's the perfect score and a good compass, but the exam passes at 700. This plan aims for a steady 850 or higher on mock exams, the margin that protects you from new questions or a bad day."
          )}
        </p>
      </Panel>

      <ol className="relative space-y-5 before:absolute before:top-2 before:bottom-2 before:left-[21px] before:w-px before:bg-hairline-strong">
        {phases.map((p, i) => {
          const state = i < cur ? "past" : i === cur ? "now" : "next";
          return (
            <li className="relative pl-16" key={p.id}>
              <span
                className={cn(
                  "numeral absolute top-6 left-0 grid size-[43px] place-items-center rounded-full text-[19px]",
                  state === "now" && "bg-gilt text-abyss shadow-[0_0_0_6px_rgba(201,162,39,0.18)]",
                  state === "past" && "border border-gilt/60 bg-abyss text-gilt",
                  state === "next" && "border border-hairline-strong bg-abyss text-mist"
                )}
              >
                {i + 1}
              </span>
              <Panel className={cn("p-6 sm:p-7", state === "now" && "border-gilt/50", state === "past" && "opacity-70")}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="text-[27px] leading-tight">{tl(p.title)}</h2>
                  <p className="text-[13.5px] text-mist">
                    {formatDate(p.start, lang)} {x("al", "to")} {formatDate(p.end, lang)}
                    {state === "now" ? <span className="ml-3 rounded-full bg-gilt/15 px-2.5 py-0.5 text-gilt-pale">{x("Estás aquí", "You are here")}</span> : null}
                  </p>
                </div>
                <p className="mt-2 text-[15px] text-ivory/80">{tl(p.focus)}</p>
                <ul className="mt-4 space-y-2">
                  {p.tasks.map((t, k) => (
                    <li className="relative pl-5 text-[14.5px] leading-relaxed text-ivory/90" key={k}>
                      <span className="absolute top-[0.7em] left-0 h-px w-2.5 bg-gilt" />
                      {tl(t)}
                    </li>
                  ))}
                </ul>
                {p.target ? (
                  <p className="mt-4 text-[13.5px] text-mist">
                    {x("Objetivo al cerrar la fase:", "Target by the end of the phase:")} <span className="numeral text-[17px] text-gilt-pale">{p.target}</span>{" "}
                    {x("en simulacro", "on a mock exam")}
                  </p>
                ) : null}
                {state === "now" && p.domain ? (
                  <Link className="mt-5 inline-block" to={`/modules/${p.domain}`}>
                    <Button size="sm">{x("Ir al módulo", "Go to module")}</Button>
                  </Link>
                ) : null}
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
