import { Check, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { ServiceChip } from "@/components/study/ServiceIcon";
import { Button } from "@/components/ui/Button";
import { DOMAIN_BY_ID } from "@/data/domains";
import { useLang } from "@/lib/i18n";
import { isCorrect, type Prepared } from "@/lib/quiz";
import type { Level } from "@/lib/types";
import { cn } from "@/lib/utils";

export const LEVEL_LABEL: Record<Level, { es: string; en: string }> = {
  easy: { es: "Fácil", en: "Easy" },
  medium: { es: "Medio", en: "Medium" },
  hard: { es: "Avanzado", en: "Advanced" },
};

const LETTERS = ["A", "B", "C", "D", "E", "F"];

interface Props {
  item: Prepared;
  index: number;
  total: number;
  /** practice: retroalimentación inmediata. exam: solo selección. review: muestra todo resuelto */
  mode: "practice" | "exam" | "review";
  chosen?: number[];
  onChoose?: (chosen: number[]) => void;
  onAnswered?: (correct: boolean, chosen: number[]) => void;
  onNext?: () => void;
  nextLabel?: string;
}

export function QuestionCard({ item, index, total, mode, chosen: chosenProp, onChoose, onAnswered, onNext, nextLabel }: Props) {
  const { x, tl } = useLang();
  const { q, order } = item;
  const multi = q.answer.length > 1;
  const [local, setLocal] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(mode === "review");
  const chosen = chosenProp ?? local;

  useEffect(() => {
    setLocal([]);
    setSubmitted(mode === "review");
  }, [q.id, mode]);

  const toggle = (orig: number) => {
    if (submitted) return;
    let next: number[];
    if (multi) {
      next = chosen.includes(orig) ? chosen.filter((c) => c !== orig) : chosen.length < q.answer.length ? [...chosen, orig] : chosen;
    } else next = [orig];
    if (onChoose) onChoose(next);
    else setLocal(next);
  };

  const ready = chosen.length === q.answer.length;
  const right = isCorrect(q, chosen);

  const submit = () => {
    if (!ready || submitted) return;
    setSubmitted(true);
    onAnswered?.(right, chosen);
  };

  // atajos de teclado: números para elegir, Enter para enviar o continuar
  useEffect(() => {
    if (mode === "review") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const n = Number(e.key);
      if (n >= 1 && n <= order.length) toggle(order[n - 1]);
      if (e.key === "Enter" && mode === "practice") {
        if (!submitted) submit();
        else onNext?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const reveal = submitted && mode !== "exam";
  const domain = DOMAIN_BY_ID[q.domain];

  return (
    <div className="surface rounded-[var(--radius-panel)] p-5 sm:p-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-mist">
        <span className="numeral text-[17px] text-gilt-pale">
          {index + 1}
          <span className="text-faint"> / {total}</span>
        </span>
        <span>{tl(domain.short)}</span>
        <span className="rounded-full border border-hairline px-2.5 py-0.5 text-[12px]">{x(LEVEL_LABEL[q.level].es, LEVEL_LABEL[q.level].en)}</span>
        {multi ? (
          <span className="rounded-full bg-wine/50 px-2.5 py-0.5 text-[12px] text-wine-soft">
            {x(`Elige ${q.answer.length}`, `Choose ${q.answer.length}`)}
          </span>
        ) : null}
      </div>

      <h2 className="mt-5 max-w-[68ch] font-display text-[25px] leading-[1.28] sm:text-[29px]">{tl(q.q)}</h2>

      <fieldset className="mt-7 space-y-2.5">
        <legend className="sr-only">{x("Opciones", "Options")}</legend>
        {order.map((orig, i) => {
          const opt = q.options[orig];
          const picked = chosen.includes(orig);
          const isAns = q.answer.includes(orig);
          const state = !reveal ? (picked ? "picked" : "idle") : isAns ? "right" : picked ? "wrong" : "muted";
          return (
            <div key={orig}>
              <button
                aria-pressed={picked}
                className={cn(
                  "group flex w-full items-start gap-4 rounded-[14px] border px-4 py-3.5 text-left transition-[border,background] duration-200",
                  state === "idle" && "border-hairline bg-abyss/35 hover:border-hairline-strong hover:bg-plum/40",
                  state === "picked" && "border-gilt bg-gilt/10",
                  state === "right" && "border-gilt-pale/80 bg-gilt/15",
                  state === "wrong" && "border-wine-soft/60 bg-wine/35",
                  state === "muted" && "border-hairline/60 bg-abyss/25 opacity-75",
                  submitted && "cursor-default"
                )}
                onClick={() => toggle(orig)}
                type="button"
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-7 shrink-0 place-items-center text-[12px] font-bold",
                    multi ? "rounded-[7px]" : "rounded-full",
                    state === "picked" || state === "right" ? "bg-gilt text-abyss" : state === "wrong" ? "bg-wine-soft text-abyss" : "border border-hairline-strong text-mist"
                  )}
                >
                  {state === "right" ? <Check className="size-4" /> : state === "wrong" ? <X className="size-4" /> : LETTERS[i]}
                </span>
                <span className="text-[15.5px] leading-relaxed text-ivory">{tl(opt.text)}</span>
              </button>
              <AnimatePresence initial={false}>
                {reveal && (isAns || picked) ? (
                  <motion.p
                    animate={{ opacity: 1, height: "auto" }}
                    className={cn("overflow-hidden pr-2 pl-[60px] text-[13.5px] leading-relaxed", isAns ? "text-gilt-pale/90" : "text-wine-soft")}
                    exit={{ opacity: 0, height: 0 }}
                    initial={{ opacity: 0, height: 0 }}
                  >
                    <span className="block pt-2 pb-1">{tl(opt.why)}</span>
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </fieldset>

      <AnimatePresence>
        {reveal ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={cn("mt-7 rounded-[16px] border p-5", right ? "border-gilt/40 bg-gilt/8" : "border-wine-soft/30 bg-wine/20")}
            initial={{ opacity: 0, y: 8 }}
          >
            <p className={cn("font-display text-[22px]", right ? "text-gilt-pale" : "text-wine-soft")}>
              {mode === "review" && chosen.length === 0
                ? x("Sin responder", "Not answered")
                : right
                  ? x("Correcto", "Correct")
                  : x("Todavía no", "Not quite")}
            </p>
            <p className="mt-2 max-w-[72ch] text-[15px] leading-relaxed text-ivory/90">{tl(q.explain)}</p>
            {!right && mode !== "review" ? (
              <p className="mt-3 text-[13.5px] text-mist">
                {x("Respuesta correcta: ", "Correct answer: ")}
                {order
                  .map((o, i) => (q.answer.includes(o) ? LETTERS[i] : null))
                  .filter(Boolean)
                  .join(", ")}
              </p>
            ) : null}
            {q.services?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {q.services.map((s) => (
                  <ServiceChip id={s} key={s} />
                ))}
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {mode === "practice" ? (
        <div className="mt-7 flex items-center justify-between gap-4">
          <p className="hidden text-[12.5px] text-faint sm:block">
            {x("Atajos: teclas 1 a 5 para elegir, Enter para continuar", "Shortcuts: keys 1 to 5 to choose, Enter to continue")}
          </p>
          {!submitted ? (
            <Button disabled={!ready} onClick={submit} size="lg">
              {x("Comprobar respuesta", "Check answer")}
            </Button>
          ) : (
            <Button onClick={onNext} size="lg">
              {nextLabel ?? x("Siguiente pregunta", "Next question")}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
