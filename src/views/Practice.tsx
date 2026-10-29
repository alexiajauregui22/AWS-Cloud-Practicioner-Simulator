import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LEVEL_LABEL, QuestionCard } from "@/components/study/QuestionCard";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Segmented } from "@/components/ui/Segmented";
import { DOMAIN_BY_ID, DOMAINS } from "@/data/domains";
import { practiceFeedback } from "@/lib/coach";
import { useLang } from "@/lib/i18n";
import { pickPractice, type Prepared } from "@/lib/quiz";
import { domainStats, unlockedLevels } from "@/lib/stats";
import { actions, getState, useStore } from "@/lib/store";
import type { DomainId, Level } from "@/lib/types";

type DomainOpt = DomainId | "all";
type LevelOpt = Level | "mixed";

interface Result {
  qid: string;
  correct: boolean;
}

export default function Practice() {
  const s = useStore();
  const { x, tl } = useLang();
  const [params, setParams] = useSearchParams();
  const [domain, setDomain] = useState<DomainOpt>((params.get("domain") as DomainId) ?? "all");
  const [level, setLevel] = useState<LevelOpt>((params.get("level") as Level) ?? "mixed");
  const [count, setCount] = useState<"10" | "20">("10");
  const [mistakesOnly, setMistakesOnly] = useState(params.get("mistakes") === "1");
  const [items, setItems] = useState<Prepared[] | null>(null);
  const [i, setI] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [notice, setNotice] = useState(false);
  const ds = useMemo(() => domainStats(s), [s]);

  // en "todos los dominios" el nivel se desbloquea si lo está en al menos un dominio
  const unlocked = useMemo(() => {
    if (domain !== "all") return unlockedLevels(ds.find((d) => d.id === domain)!);
    const all = ds.map(unlockedLevels);
    return { easy: true, medium: all.some((u) => u.medium), hard: all.some((u) => u.hard) };
  }, [domain, ds]);

  const start = () => {
    const picked = pickPractice(getState(), {
      domain: domain === "all" ? null : domain,
      level: level === "mixed" ? null : level,
      levels: level === "mixed" ? (["easy", "medium", "hard"] as Level[]).filter((l) => unlocked[l]) : undefined,
      count: Number(count),
      onlyMistakes: mistakesOnly,
    });
    if (!picked.length) {
      setNotice(true);
      setItems(null);
      return;
    }
    setNotice(false);
    setItems(picked);
    setI(0);
    setResults([]);
  };

  useEffect(() => {
    if (params.get("auto") === "1") {
      start();
      params.delete("auto");
      setParams(params, { replace: true });
    }
    // solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sesión en curso
  if (items && i < items.length) {
    const item = items[i];
    return (
      <div className="mx-auto max-w-[860px]">
        <div className="mb-6 flex items-center gap-4">
          <Button onClick={() => setItems(null)} size="sm" variant="quiet">
            {x("Salir", "Exit")}
          </Button>
          <ProgressBar className="flex-1" label={x("Progreso de la sesión", "Session progress")} value={i / items.length} />
          <p className="numeral text-[15px] text-mist">
            {results.filter((r) => r.correct).length} {x("correctas", "correct")}
          </p>
        </div>
        <QuestionCard
          index={i}
          item={item}
          key={item.q.id + i}
          mode="practice"
          nextLabel={i === items.length - 1 ? x("Ver resultado", "See result") : undefined}
          onAnswered={(correct) => {
            actions.recordAnswer({ qid: item.q.id, domain: item.q.domain, level: item.q.level, correct, mode: "practice" });
            setResults((r) => [...r, { qid: item.q.id, correct }]);
          }}
          onNext={() => setI((v) => v + 1)}
          total={items.length}
        />
      </div>
    );
  }

  // resumen de la sesión
  if (items && i >= items.length) {
    const correct = results.filter((r) => r.correct).length;
    const fb = practiceFeedback(correct, results.length);
    return (
      <div className="mx-auto max-w-[760px]">
        <Panel className="p-8 sm:p-12">
          <p className="text-[14px] text-mist">{x("Sesión terminada", "Session complete")}</p>
          <motion.p animate={{ opacity: 1, y: 0 }} className="numeral mt-4 text-[96px] leading-none" initial={{ opacity: 0, y: 10 }}>
            {correct}
            <span className="text-[40px] text-faint"> / {results.length}</span>
          </motion.p>
          <p className="mt-6 max-w-[54ch] font-display text-[26px] leading-snug text-ivory">{tl(fb)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={start} size="lg">
              {x("Otra ronda igual", "Another round")}
            </Button>
            <Button onClick={() => setItems(null)} size="lg" variant="ghost">
              {x("Cambiar ajustes", "Change settings")}
            </Button>
            <Link to="/">
              <Button size="lg" variant="quiet">
                {x("Volver al inicio", "Back to home")}
              </Button>
            </Link>
          </div>
        </Panel>
      </div>
    );
  }

  // configuración
  const levelOpts = (["easy", "medium", "hard"] as Level[]).map((l) => ({
    value: l as LevelOpt,
    label: x(LEVEL_LABEL[l].es, LEVEL_LABEL[l].en),
    disabled: !unlocked[l],
    hint: !unlocked[l] ? x("Logra 70% en el nivel anterior para desbloquear", "Reach 70% on the previous level to unlock") : undefined,
  }));

  return (
    <div>
      <header className="mb-8 max-w-[62ch]">
        <h1 className="text-[44px] leading-[1.05] sm:text-[56px]">{x("Práctica", "Practice")}</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-mist">
          {x(
            "Preguntas al azar, primero las que nunca viste y luego las que fallaste. Después de cada respuesta verás por qué cada opción es correcta o no.",
            "Random questions, first the ones you've never seen, then the ones you missed. After each answer you'll see why each option is right or wrong."
          )}
        </p>
      </header>

      <Panel className="space-y-8 p-6 sm:p-9">
        <div>
          <p className="mb-3 text-[14px] text-ivory">{x("Dominio", "Domain")}</p>
          <Segmented
            label={x("Dominio", "Domain")}
            onChange={(v) => {
              setDomain(v);
              setLevel("mixed");
            }}
            options={[
              { value: "all" as DomainOpt, label: x("Todos", "All") },
              ...DOMAINS.map((d) => ({ value: d.id as DomainOpt, label: `${tl(d.short)} ${d.weight}%` })),
            ]}
            value={domain}
          />
        </div>
        <div>
          <p className="mb-3 text-[14px] text-ivory">{x("Nivel", "Level")}</p>
          <Segmented
            label={x("Nivel", "Level")}
            onChange={setLevel}
            options={[{ value: "mixed" as LevelOpt, label: x("Mixto", "Mixed") }, ...levelOpts]}
            value={level}
          />
          <p className="mt-3 text-[13px] text-faint">
            {x(
              "Medio se desbloquea con 70% en Fácil, y Avanzado con 70% en Medio. Mixto incluye solo los niveles que ya tienes desbloqueados.",
              "Medium unlocks at 70% on Easy, and Advanced at 70% on Medium. Mixed only includes levels you've unlocked."
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-10">
          <div>
            <p className="mb-3 text-[14px] text-ivory">{x("Preguntas", "Questions")}</p>
            <Segmented
              label={x("Cantidad", "Count")}
              onChange={setCount}
              options={[
                { value: "10", label: "10" },
                { value: "20", label: "20" },
              ]}
              value={count}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-[14px]">
            <input checked={mistakesOnly} className="size-4 accent-[#c9a227]" onChange={(e) => setMistakesOnly(e.target.checked)} type="checkbox" />
            {x("Solo preguntas que fallé", "Only questions I missed")}
          </label>
        </div>
        <div className="rule" />
        {notice ? (
          <p className="rounded-[12px] border border-wine-soft/30 bg-wine/25 px-4 py-3 text-[14px] text-wine-soft">
            {x("No hay preguntas con estos filtros. Quita 'Solo preguntas que fallé' o cambia el dominio.", "No questions match these filters. Turn off 'Only questions I missed' or change the domain.")}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-[14px] text-mist">
            {domain === "all" ? x("Todos los dominios", "All domains") : tl(DOMAIN_BY_ID[domain].title)}
            {", "}
            {level === "mixed" ? x("niveles mezclados", "mixed levels") : x(LEVEL_LABEL[level].es, LEVEL_LABEL[level].en).toLowerCase()}
          </p>
          <Button onClick={start} size="lg">
            {x("Empezar práctica", "Start practice")}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
