import { Flag, LayoutGrid } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { QuestionCard } from "@/components/study/QuestionCard";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Segmented } from "@/components/ui/Segmented";
import { DOMAIN_BY_ID, DOMAINS } from "@/data/domains";
import { QUESTION_BY_ID } from "@/data/questions";
import { examFeedback } from "@/lib/coach";
import { daysBetween, formatDate, parseDay } from "@/lib/dates";
import { useLang } from "@/lib/i18n";
import { buildExam, examMinutes, isCorrect, PASS, type Prepared, scaledScore } from "@/lib/quiz";
import { actions, type ExamResult, useStore } from "@/lib/store";
import type { DomainId } from "@/lib/types";
import { cn } from "@/lib/utils";

/* Lobby */

function Lobby() {
  const { x, lang } = useLang();
  const { exams } = useStore();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [kind, setKind] = useState<"full" | "mini">((params.get("kind") as "mini") ?? "full");

  return (
    <div>
      <header className="mb-8 max-w-[62ch]">
        <h1 className="text-[44px] leading-[1.05] sm:text-[56px]">{x("Simulacro de examen", "Mock exam")}</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-mist">
          {x(
            "Como el examen real: sin retroalimentación hasta el final, con tiempo límite y la misma distribución por dominio. Al terminar recibirás tu puntaje en la escala de 100 a 1000 y la explicación de cada pregunta.",
            "Like the real exam: no feedback until the end, a time limit and the same domain distribution. When you finish you'll get your score on the 100 to 1000 scale and the explanation for every question."
          )}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Panel className="p-6 sm:p-9">
          <Segmented
            label={x("Tipo de simulacro", "Mock exam type")}
            onChange={setKind}
            options={[
              { value: "full", label: x("Completo: 65 preguntas", "Full: 65 questions") },
              { value: "mini", label: x("Mini: 20 preguntas", "Mini: 20 questions") },
            ]}
            value={kind}
          />
          <dl className="mt-8 grid grid-cols-3 gap-4">
            {[
              [kind === "full" ? "65" : "20", x("preguntas", "questions")],
              [String(examMinutes(kind)), x("minutos", "minutes")],
              ["700", x("para aprobar", "to pass")],
            ].map(([v, l]) => (
              <div className="inset rounded-[14px] p-4" key={l}>
                <dd className="numeral text-[40px] leading-none text-gilt-pale">{v}</dd>
                <dt className="mt-2 text-[13px] text-mist">{l}</dt>
              </div>
            ))}
          </dl>
          <div className="mt-8 space-y-3">
            {DOMAINS.map((d) => (
              <div className="flex items-center gap-4 text-[14px]" key={d.id}>
                <span className="w-32 text-mist">{x(d.short.es, d.short.en)}</span>
                <ProgressBar className="flex-1" value={d.weight / 34} />
                <span className="numeral w-10 text-right text-mist">{d.weight}%</span>
              </div>
            ))}
          </div>
          <p className="mt-8 text-[13.5px] leading-relaxed text-faint">
            {x(
              "El examen real tiene 65 preguntas, de las cuales 15 no puntúan y no se identifican. Aquí todas cuentan, y el puntaje es una aproximación lineal a la escala oficial.",
              "The real exam has 65 questions, 15 of which are unscored and unidentified. Here every question counts, and the score is a linear approximation of the official scale."
            )}
          </p>
          <Button className="mt-8" onClick={() => nav(`/exam/run?kind=${kind}`)} size="lg">
            {x("Empezar simulacro", "Start mock exam")}
          </Button>
        </Panel>

        <Panel className="p-6 sm:p-8">
          <h2 className="text-[26px]">{x("Historial", "History")}</h2>
          {exams.length ? (
            <ul className="mt-5 divide-y divide-hairline">
              {[...exams].reverse().slice(0, 8).map((e) => (
                <li key={e.id}>
                  <Link className="flex items-center justify-between gap-4 py-3.5 hover:text-gilt-pale" to={`/exam/result/${e.id}`}>
                    <div>
                      <p className="text-[14px]">
                        {e.kind === "full" ? x("Completo", "Full") : x("Mini", "Mini")},{" "}
                        {formatDate(new Date(e.at), lang, { day: "numeric", month: "short" })}
                      </p>
                      <p className="text-[12.5px] text-faint">
                        {e.correct} / {e.total}
                      </p>
                    </div>
                    <p className={cn("numeral text-[30px]", e.score >= PASS ? "text-gilt-pale" : "text-wine-soft")}>{e.score}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[15px] leading-relaxed text-mist">
              {x("Aquí aparecerán tus simulacros con su puntaje.", "Your mock exams and scores will appear here.")}
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* Ejecución */

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

function Runner() {
  const { x } = useLang();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const kind = (params.get("kind") === "mini" ? "mini" : "full") as "full" | "mini";
  const [items] = useState<Prepared[]>(() => buildExam(kind));
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [i, setI] = useState(0);
  const [grid, setGrid] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const limit = examMinutes(kind) * 60;
  const startedAt = useRef(Date.now());
  const [left, setLeft] = useState(limit);
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    const byDomain = Object.fromEntries(DOMAINS.map((d) => [d.id, { c: 0, t: 0 }])) as ExamResult["byDomain"];
    const list = items.map(({ q }) => {
      const chosen = answers[q.id] ?? [];
      const correct = isCorrect(q, chosen);
      byDomain[q.domain].t++;
      if (correct) byDomain[q.domain].c++;
      return { qid: q.id, chosen, correct };
    });
    const correct = list.filter((a) => a.correct).length;
    const r: ExamResult = {
      id: `ex-${Date.now()}`,
      at: Date.now(),
      kind,
      score: scaledScore(correct, items.length),
      correct,
      total: items.length,
      durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      byDomain,
      answers: list,
    };
    actions.saveExam(
      r,
      items.map(({ q }, k) => ({ qid: q.id, domain: q.domain, level: q.level, correct: list[k].correct, mode: "exam" as const }))
    );
    nav(`/exam/result/${r.id}`, { replace: true });
  };

  useEffect(() => {
    const t = setInterval(() => {
      const l = limit - Math.floor((Date.now() - startedAt.current) / 1000);
      setLeft(Math.max(0, l));
    }, 1000);
    return () => clearInterval(t);
  }, [limit]);

  useEffect(() => {
    if (left === 0) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  // avisa antes de cerrar la pestaña en medio del simulacro
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  const item = items[i];
  const answered = Object.values(answers).filter((a) => a.length).length;
  const low = left < 300;

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="sticky top-3 z-20 mb-6 flex items-center gap-3 rounded-full border border-hairline bg-abyss/80 px-3 py-2 backdrop-blur-xl">
        <span className={cn("numeral min-w-[72px] rounded-full px-3 py-1 text-center text-[18px]", low ? "bg-wine/60 text-wine-soft" : "text-gilt-pale")} role="timer">
          {fmt(left)}
        </span>
        <ProgressBar className="flex-1" label={x("Respondidas", "Answered")} value={answered / items.length} />
        <span className="numeral hidden text-[14px] text-mist sm:inline">
          {answered}/{items.length}
        </span>
        <Button aria-label={x("Ver todas las preguntas", "View all questions")} onClick={() => setGrid((g) => !g)} size="sm" variant="quiet">
          <LayoutGrid className="size-4" />
        </Button>
        <Button onClick={() => setConfirm(true)} size="sm" variant="ghost">
          {x("Terminar", "Finish")}
        </Button>
      </div>

      <AnimatePresence>
        {grid ? (
          <motion.div animate={{ opacity: 1, y: 0 }} className="mb-6" exit={{ opacity: 0, y: -6 }} initial={{ opacity: 0, y: -6 }}>
            <Panel className="grid grid-cols-8 gap-2 p-4 sm:grid-cols-13">
              {items.map(({ q }, k) => (
                <button
                  className={cn(
                    "numeral relative h-9 rounded-[9px] text-[15px] transition-colors",
                    k === i ? "bg-gilt text-abyss" : answers[q.id]?.length ? "bg-plum text-ivory" : "border border-hairline text-mist hover:border-hairline-strong"
                  )}
                  key={q.id}
                  onClick={() => {
                    setI(k);
                    setGrid(false);
                  }}
                  type="button"
                >
                  {k + 1}
                  {flags[q.id] ? <span className="absolute top-1 right-1 size-1.5 rounded-full bg-wine-soft" /> : null}
                </button>
              ))}
            </Panel>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <QuestionCard
        chosen={answers[item.q.id] ?? []}
        index={i}
        item={item}
        mode="exam"
        onChoose={(c) => setAnswers((a) => ({ ...a, [item.q.id]: c }))}
        total={items.length}
      />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Button disabled={i === 0} onClick={() => setI((v) => v - 1)} variant="quiet">
          {x("Anterior", "Previous")}
        </Button>
        <Button
          className={cn(flags[item.q.id] && "border-wine-soft text-wine-soft")}
          onClick={() => setFlags((f) => ({ ...f, [item.q.id]: !f[item.q.id] }))}
          size="sm"
          variant="ghost"
        >
          <Flag className="size-4" />
          {flags[item.q.id] ? x("Marcada para revisar", "Flagged for review") : x("Marcar para revisar", "Flag for review")}
        </Button>
        {i < items.length - 1 ? (
          <Button onClick={() => setI((v) => v + 1)}>{x("Siguiente", "Next")}</Button>
        ) : (
          <Button onClick={() => setConfirm(true)}>{x("Terminar simulacro", "Finish mock exam")}</Button>
        )}
      </div>

      <AnimatePresence>
        {confirm ? (
          <motion.div
            animate={{ opacity: 1 }}
            aria-modal="true"
            className="fixed inset-0 z-50 grid place-items-center bg-abyss/70 p-4 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            role="dialog"
          >
            <Panel className="w-full max-w-[460px] p-7">
              <h2 className="text-[28px]">{x("¿Terminar el simulacro?", "Finish the mock exam?")}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ivory/85">
                {items.length - answered > 0
                  ? x(
                      `Te quedan ${items.length - answered} preguntas sin responder. En el examen real, una pregunta sin responder cuenta como incorrecta.`,
                      `You have ${items.length - answered} unanswered questions. On the real exam, an unanswered question counts as wrong.`
                    )
                  : x("Respondiste todas las preguntas.", "You answered every question.")}
                {Object.values(flags).filter(Boolean).length
                  ? x(` Tienes ${Object.values(flags).filter(Boolean).length} marcadas para revisar.`, ` You have ${Object.values(flags).filter(Boolean).length} flagged for review.`)
                  : ""}
              </p>
              <div className="mt-7 flex flex-wrap justify-end gap-3">
                <Button onClick={() => setConfirm(false)} variant="quiet">
                  {x("Seguir respondiendo", "Keep answering")}
                </Button>
                <Button onClick={finish}>{x("Terminar y ver resultado", "Finish and see result")}</Button>
              </div>
            </Panel>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* Resultado */

function Result() {
  const { id } = useParams();
  const s = useStore();
  const { x, tl, lang } = useLang();
  const [filter, setFilter] = useState<"wrong" | "all">("wrong");
  const idx = s.exams.findIndex((e) => e.id === id);
  const r = s.exams[idx];
  const prev = idx > 0 ? s.exams[idx - 1] : undefined;
  const note = useMemo(() => (r ? examFeedback(r, prev, daysBetween(new Date(r.at), parseDay(s.examDate))) : null), [r, prev, s.examDate]);
  if (!r || !note) return <Navigate replace to="/exam" />;
  const passed = r.score >= PASS;
  const list = r.answers.filter((a) => (filter === "wrong" ? !a.correct : true));

  return (
    <div className="space-y-6">
      <Link className="text-[14px] text-mist hover:text-ivory" to="/exam">
        {x("Volver a simulacros", "Back to mock exams")}
      </Link>
      <Panel className="p-7 sm:p-11">
        <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:items-center">
          <div>
            <p className="text-[14px] text-mist">
              {r.kind === "full" ? x("Simulacro completo", "Full mock exam") : x("Mini simulacro", "Mini mock exam")},{" "}
              {formatDate(new Date(r.at), lang, { day: "numeric", month: "long" })}
            </p>
            <motion.p animate={{ opacity: 1, scale: 1 }} className={cn("numeral mt-3 text-[120px] leading-[0.9]", passed ? "gilt-text" : "text-ivory")} initial={{ opacity: 0, scale: 0.96 }}>
              {r.score}
            </motion.p>
            <p className="mt-3 text-[15px] text-mist">
              {r.correct} / {r.total} {x("correctas en", "correct in")} {Math.round(r.durationSec / 60)} min
            </p>
            <ProgressBar className="mt-5 w-64" marker={(PASS - 100) / 900} tone={passed ? "gilt" : "wine"} value={(r.score - 100) / 900} />
          </div>
          <div className="max-w-[60ch]">
            <h1 className="text-[34px] leading-tight sm:text-[40px]">{tl(note.headline)}</h1>
            <p className="mt-4 text-[16px] leading-relaxed text-ivory/90">{tl(note.body)}</p>
            <div className="mt-6 rounded-[14px] border-gilt border-l-2 bg-gilt/8 px-5 py-4">
              <p className="font-display text-[19px] text-gilt-pale">{x("Siguiente paso", "Next step")}</p>
              <p className="mt-1 text-[15px] leading-relaxed">{tl(note.next)}</p>
            </div>
          </div>
        </div>
      </Panel>

      <Panel className="p-6 sm:p-8">
        <h2 className="text-[26px]">{x("Resultado por dominio", "Result by domain")}</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {(Object.entries(r.byDomain) as [DomainId, { c: number; t: number }][]).map(([d, v]) => {
            const p = v.t ? v.c / v.t : 0;
            return (
              <div key={d}>
                <div className="flex items-baseline justify-between">
                  <p className="font-display text-[20px]">{tl(DOMAIN_BY_ID[d].title)}</p>
                  <p className="numeral text-[18px] text-mist">
                    {v.c}/{v.t}
                  </p>
                </div>
                <ProgressBar className="mt-2.5" marker={0.7} tone={p >= 0.7 ? "gilt" : "wine"} value={p} />
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="flex flex-wrap items-end justify-between gap-4 pt-4">
        <h2 className="text-[30px]">{x("Revisión de preguntas", "Question review")}</h2>
        <Segmented
          label={x("Filtro", "Filter")}
          onChange={setFilter}
          options={[
            { value: "wrong", label: x(`Incorrectas (${r.total - r.correct})`, `Wrong (${r.total - r.correct})`) },
            { value: "all", label: x(`Todas (${r.total})`, `All (${r.total})`) },
          ]}
          value={filter}
        />
      </div>
      {list.length === 0 ? (
        <Panel className="p-8 text-[16px] text-ivory/85">{x("Ninguna incorrecta. Excelente trabajo.", "None wrong. Excellent work.")}</Panel>
      ) : (
        <div className="space-y-5">
          {list.map((a) => {
            const q = QUESTION_BY_ID[a.qid];
            if (!q) return null;
            const k = r.answers.findIndex((v) => v.qid === a.qid);
            return (
              <QuestionCard
                chosen={a.chosen}
                index={k}
                item={{ q, order: q.options.map((_, j) => j) }}
                key={a.qid}
                mode="review"
                total={r.total}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ExamView() {
  return (
    <Routes>
      <Route element={<Lobby />} index />
      <Route element={<Runner />} path="run" />
      <Route element={<Result />} path="result/:id" />
      <Route element={<Navigate replace to="/exam" />} path="*" />
    </Routes>
  );
}
