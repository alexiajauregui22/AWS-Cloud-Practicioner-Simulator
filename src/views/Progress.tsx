import { useMemo } from "react";
import { LEVEL_LABEL } from "@/components/study/QuestionCard";
import { Panel } from "@/components/ui/Panel";
import { DOMAINS } from "@/data/domains";
import { addDays, formatDate } from "@/lib/dates";
import { useLang } from "@/lib/i18n";
import { PASS } from "@/lib/quiz";
import { activitySeries, domainStats, estimatedScore, LEVELS, level, streak } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function ScoreChart({ points, lang }: { points: { at: number; score: number }[]; lang: "es" | "en" }) {
  const W = 640;
  const H = 220;
  const pad = { l: 40, r: 16, t: 16, b: 28 };
  const y = (v: number) => pad.t + (1 - (v - 100) / 900) * (H - pad.t - pad.b);
  const xs = (i: number) => pad.l + (points.length < 2 ? (W - pad.l - pad.r) / 2 : (i / (points.length - 1)) * (W - pad.l - pad.r));
  const path = points.map((p, i) => `${i ? "L" : "M"}${xs(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");
  return (
    <svg className="h-auto w-full" role="img" viewBox={`0 0 ${W} ${H}`}>
      <title>{lang === "es" ? "Puntaje de simulacros en el tiempo" : "Mock exam score over time"}</title>
      {[100, 400, 700, 1000].map((v) => (
        <g key={v}>
          <line stroke={v === PASS ? "rgba(239,231,214,0.55)" : "rgba(240,208,96,0.10)"} strokeDasharray={v === PASS ? "4 4" : undefined} x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} />
          <text fill="rgba(239,231,214,0.5)" fontSize="11" textAnchor="end" x={pad.l - 8} y={y(v) + 4}>
            {v}
          </text>
        </g>
      ))}
      {points.length > 1 ? <path d={path} fill="none" stroke="#f0d060" strokeLinejoin="round" strokeWidth="2" /> : null}
      {points.map((p, i) => (
        <g key={p.at}>
          <circle cx={xs(i)} cy={y(p.score)} fill={p.score >= PASS ? "#f0d060" : "#e6a4ae"} r="4" />
          <title>{`${p.score}, ${formatDate(new Date(p.at), lang)}`}</title>
        </g>
      ))}
    </svg>
  );
}

export default function Progress() {
  const s = useStore();
  const { x, tl, lang } = useLang();
  const ds = useMemo(() => domainStats(s), [s]);
  const est = estimatedScore(s);
  const total = s.attempts.length;
  const correct = s.attempts.filter((a) => a.correct).length;
  const lv = level(s.xp);
  const last14 = activitySeries(s.activity, 14);
  const max14 = Math.max(1, ...last14);

  const tiles = [
    [String(total), x("respuestas", "answers")],
    [total ? `${Math.round((100 * correct) / total)}%` : "—", x("acierto total", "overall accuracy")],
    [String(streak(s.activity)), x("días de racha", "day streak")],
    [`${lv.lv}`, `${x("nivel", "level")}, ${s.xp} XP`],
    [String(est ?? "—"), x("puntaje estimado", "estimated score")],
  ];

  return (
    <div className="space-y-6">
      <header className="mb-2 max-w-[62ch]">
        <h1 className="text-[44px] leading-[1.05] sm:text-[56px]">{x("Tu progreso", "Your progress")}</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-mist">
          {x("Cómo vas día a día y dónde están tus puntos fuertes y débiles.", "How you're doing day by day and where your strengths and gaps are.")}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {tiles.map(([v, l]) => (
          <Panel className="p-5" key={l}>
            <p className="numeral text-[40px] leading-none text-ivory">{v}</p>
            <p className="mt-2 text-[13px] text-mist">{l}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="p-6 sm:p-8">
          <h2 className="text-[26px]">{x("Simulacros", "Mock exams")}</h2>
          <p className="mt-1 text-[13.5px] text-mist">{x("La línea punteada marca 700, la nota que aprueba.", "The dashed line marks 700, the passing score.")}</p>
          <div className="mt-6">
            {s.exams.length ? (
              <ScoreChart lang={lang} points={s.exams.map((e) => ({ at: e.at, score: e.score }))} />
            ) : (
              <p className="py-10 text-[15px] text-mist">{x("Completa un simulacro para ver tu curva.", "Finish a mock exam to see your curve.")}</p>
            )}
          </div>
        </Panel>

        <Panel className="p-6 sm:p-8">
          <h2 className="text-[26px]">{x("Últimos 14 días", "Last 14 days")}</h2>
          <div className="mt-6 flex h-[180px] items-end gap-1.5">
            {last14.map((v, i) => {
              const d = addDays(new Date(), i - 13);
              return (
                <div className="flex flex-1 flex-col items-center gap-2" key={i}>
                  <div
                    className={cn("w-full rounded-t-[5px]", v >= s.dailyGoal ? "bg-gilt-pale" : v ? "bg-gilt/55" : "bg-ivory/8")}
                    style={{ height: `${Math.max(4, (v / max14) * 150)}px` }}
                    title={`${v}`}
                  />
                  <span className="text-[10.5px] text-faint">{formatDate(d, lang, { day: "numeric" })}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[13px] text-mist">
            {x(`Las barras claras cumplieron tu meta de ${s.dailyGoal}.`, `Bright bars met your goal of ${s.dailyGoal}.`)}
          </p>
        </Panel>
      </div>

      <Panel className="overflow-x-auto p-6 sm:p-8">
        <h2 className="text-[26px]">{x("Acierto por dominio y nivel", "Accuracy by domain and level")}</h2>
        <table className="mt-6 w-full min-w-[560px] text-left text-[14px]">
          <thead>
            <tr className="text-mist">
              <th className="pb-3 font-medium">{x("Dominio", "Domain")}</th>
              {LEVELS.map((l) => (
                <th className="pb-3 font-medium" key={l}>
                  {x(LEVEL_LABEL[l].es, LEVEL_LABEL[l].en)}
                </th>
              ))}
              <th className="pb-3 font-medium">{x("Dominado", "Mastered")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {DOMAINS.map((d) => {
              const st = ds.find((v) => v.id === d.id)!;
              return (
                <tr key={d.id}>
                  <td className="py-3.5 font-display text-[18px]">{tl(d.title)}</td>
                  {LEVELS.map((l) => {
                    const b = st.byLevel[l];
                    const p = b.t ? b.c / b.t : null;
                    return (
                      <td className="py-3.5" key={l}>
                        {p === null ? (
                          <span className="text-faint">—</span>
                        ) : (
                          <span
                            className={cn("numeral rounded-full px-2.5 py-0.5 text-[15px]", p >= 0.7 ? "bg-gilt/15 text-gilt-pale" : "bg-wine/40 text-wine-soft")}
                          >
                            {Math.round(p * 100)}%<span className="text-[12px] opacity-70"> ({b.t})</span>
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="numeral py-3.5 text-[16px]">{Math.round(st.mastery * 100)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
