import { Check, ChevronDown, Lock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Deck } from "@/components/study/Deck";
import { LEVEL_LABEL } from "@/components/study/QuestionCard";
import { ServiceIcon } from "@/components/study/ServiceIcon";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Segmented } from "@/components/ui/Segmented";
import { DOMAIN_BY_ID } from "@/data/domains";
import { FLASHCARDS } from "@/data/flashcards";
import { questionsByDomain } from "@/data/questions";
import { SERVICE_BY_ID } from "@/data/services";
import { useLang } from "@/lib/i18n";
import { domainStats, LEVELS, lastByQuestion, unlockedLevels } from "@/lib/stats";
import { actions, useStore } from "@/lib/store";
import type { DomainId, Lesson } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "theory" | "cards" | "practice";

function LessonBlock({ lesson, n, open, onToggle }: { lesson: Lesson; n: number; open: boolean; onToggle: () => void }) {
  const { x, tl } = useLang();
  const { lessonsDone } = useStore();
  const done = !!lessonsDone[lesson.id];
  return (
    <Panel className={cn("overflow-hidden transition-[border-color]", open && "border-hairline-strong")}>
      <button aria-expanded={open} className="flex w-full items-start gap-5 p-6 text-left sm:p-7" onClick={onToggle} type="button">
        <span
          className={cn(
            "numeral grid size-11 shrink-0 place-items-center rounded-full text-[20px]",
            done ? "bg-gilt text-abyss" : "border border-hairline-strong text-gilt-pale"
          )}
        >
          {done ? <Check className="size-5" /> : n}
        </span>
        <span className="flex-1">
          <span className="block font-display text-[26px] leading-tight">{tl(lesson.title)}</span>
          <span className="mt-1.5 block max-w-[64ch] text-[15px] leading-relaxed text-mist">{tl(lesson.summary)}</span>
        </span>
        <ChevronDown className={cn("mt-2 size-5 shrink-0 text-mist transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} initial={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}>
            <div className="px-6 pb-7 sm:pl-[92px] sm:pr-10">
              <ul className="space-y-3.5">
                {lesson.points.map((p, i) => (
                  <li className="relative max-w-[70ch] pl-5 text-[15.5px] leading-[1.7] text-ivory/90" key={i}>
                    <span className="absolute top-[0.8em] left-0 h-px w-2.5 bg-gilt" />
                    {tl(p)}
                  </li>
                ))}
              </ul>

              {lesson.services?.length ? (
                <div className="mt-7">
                  <p className="text-[13px] text-mist">{x("Servicios de esta lección", "Services in this lesson")}</p>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    {lesson.services.map((id) => {
                      const svc = SERVICE_BY_ID[id];
                      return (
                        <div className="inset flex items-start gap-3 rounded-[12px] p-3" key={id}>
                          <ServiceIcon id={id} size={36} />
                          <div>
                            <p className="text-[14px] font-semibold">{svc.name}</p>
                            <p className="mt-0.5 text-[13px] leading-snug text-mist">{tl(svc.what)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {lesson.tip ? (
                <div className="mt-7 rounded-[14px] border-gilt border-l-2 bg-gilt/8 px-5 py-4">
                  <p className="font-display text-[19px] text-gilt-pale">{x("Truco de examen", "Exam tip")}</p>
                  <p className="mt-1.5 max-w-[68ch] text-[15px] leading-relaxed text-ivory/90">{tl(lesson.tip)}</p>
                </div>
              ) : null}

              <div className="mt-7">
                {done ? (
                  <p className="text-[14px] text-gilt-pale">{x("Lección completada", "Lesson completed")}</p>
                ) : (
                  <Button onClick={() => actions.completeLesson(lesson.id)} variant="ghost">
                    {x("Marcar como estudiada", "Mark as studied")}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Panel>
  );
}

export default function ModuleDetail() {
  const { id } = useParams();
  const s = useStore();
  const { x, tl } = useLang();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("theory");
  const [open, setOpen] = useState<string | null>(null);
  const domain = id ? DOMAIN_BY_ID[id as DomainId] : undefined;
  const ds = useMemo(() => domainStats(s), [s]);
  const cards = useMemo(() => FLASHCARDS.filter((c) => c.domain === domain?.id), [domain?.id]);
  if (!domain) return <Navigate replace to="/modules" />;

  const st = ds.find((d) => d.id === domain.id)!;
  const unlocked = unlockedLevels(st);
  const qs = questionsByDomain(domain.id);
  const last = lastByQuestion(s.attempts);
  const mistakes = qs.filter((q) => last.get(q.id)?.correct === false).length;

  return (
    <div>
      <Link className="text-[14px] text-mist hover:text-ivory" to="/modules">
        {x("Todos los módulos", "All modules")}
      </Link>
      <header className="mt-4 mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-[60ch]">
          <h1 className="text-[44px] leading-[1.05] sm:text-[56px]">{tl(domain.title)}</h1>
          <p className="mt-3 text-[16px] leading-relaxed text-mist">{tl(domain.description)}</p>
        </div>
        <div className="text-right">
          <p className="numeral gilt-text text-[56px] leading-none">{domain.weight}%</p>
          <p className="text-[13px] text-mist">{x("del examen", "of the exam")}</p>
        </div>
      </header>

      <Segmented
        className="mb-8"
        label={x("Secciones del módulo", "Module sections")}
        onChange={setTab}
        options={[
          { value: "theory", label: x("Teoría", "Theory") },
          { value: "cards", label: `Flashcards (${cards.length})` },
          { value: "practice", label: x("Práctica por niveles", "Practice by level") },
        ]}
        value={tab}
      />

      {tab === "theory" ? (
        <div className="space-y-4">
          {domain.lessons.map((l, i) => (
            <LessonBlock key={l.id} lesson={l} n={i + 1} onToggle={() => setOpen(open === l.id ? null : l.id)} open={open === l.id} />
          ))}
        </div>
      ) : null}

      {tab === "cards" ? (
        <Panel className="p-6 sm:p-10">
          <Deck cards={cards} />
        </Panel>
      ) : null}

      {tab === "practice" ? (
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-3">
            {LEVELS.map((lv, i) => {
              const b = st.byLevel[lv];
              const ok = unlocked[lv];
              const count = qs.filter((q) => q.level === lv).length;
              return (
                <Panel className={cn("flex flex-col p-6", !ok && "opacity-70")} key={lv}>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] text-mist">
                      {x("Nivel", "Level")} {i + 1}
                    </p>
                    {!ok ? <Lock className="size-4 text-mist" /> : null}
                  </div>
                  <h3 className="mt-2 text-[30px]">{x(LEVEL_LABEL[lv].es, LEVEL_LABEL[lv].en)}</h3>
                  <p className="mt-1 text-[13px] text-mist">
                    {count} {x("preguntas", "questions")}
                  </p>
                  <ProgressBar className="mt-5" value={b.t ? b.c / b.t : 0} />
                  <p className="mt-2 text-[13px] text-faint">
                    {b.t ? `${Math.round((100 * b.c) / b.t)}% ${x("de acierto", "correct")} (${b.t})` : x("Sin intentos", "No attempts")}
                  </p>
                  <div className="mt-auto pt-6">
                    {ok ? (
                      <Button className="w-full" onClick={() => nav(`/practice?domain=${domain.id}&level=${lv}&auto=1`)}>
                        {x("Practicar 10 preguntas", "Practice 10 questions")}
                      </Button>
                    ) : (
                      <p className="text-[13px] leading-relaxed text-mist">
                        {x(
                          `Se desbloquea con 70% de acierto en ${i === 1 ? "Fácil" : "Medio"} (mínimo 6 respuestas).`,
                          `Unlocks at 70% accuracy on ${i === 1 ? "Easy" : "Medium"} (at least 6 answers).`
                        )}
                      </p>
                    )}
                  </div>
                </Panel>
              );
            })}
          </div>
          <Panel className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <p className="font-display text-[22px]">{x("Solo mis errores", "Mistakes only")}</p>
              <p className="mt-1 text-[14px] text-mist">
                {mistakes
                  ? x(`${mistakes} preguntas que fallaste la última vez.`, `${mistakes} questions you missed last time.`)
                  : x("No tienes errores pendientes en este módulo.", "No pending mistakes in this module.")}
              </p>
            </div>
            <Button disabled={!mistakes} onClick={() => nav(`/practice?domain=${domain.id}&mistakes=1&auto=1`)} variant="ghost">
              {x("Repasar errores", "Review mistakes")}
            </Button>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
