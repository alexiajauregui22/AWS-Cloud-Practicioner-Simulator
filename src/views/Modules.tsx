import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ServiceIcon } from "@/components/study/ServiceIcon";
import { Panel } from "@/components/ui/Panel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DOMAINS } from "@/data/domains";
import { questionsByDomain } from "@/data/questions";
import { useLang } from "@/lib/i18n";
import { domainStats } from "@/lib/stats";
import { useStore } from "@/lib/store";

export default function Modules() {
  const s = useStore();
  const { x, tl } = useLang();
  const ds = useMemo(() => domainStats(s), [s]);

  return (
    <div>
      <header className="mb-8 max-w-[64ch]">
        <h1 className="text-[44px] leading-[1.05] sm:text-[56px]">{x("Módulos de estudio", "Study modules")}</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-mist">
          {x(
            "Un módulo por cada dominio de la guía oficial CLF-C02. El porcentaje indica cuánto pesa en las 50 preguntas que se califican.",
            "One module per domain in the official CLF-C02 guide. The percentage is how much it weighs in the 50 scored questions."
          )}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {DOMAINS.map((d) => {
          const st = ds.find((v) => v.id === d.id)!;
          const done = d.lessons.filter((l) => s.lessonsDone[l.id]).length;
          const icons = [...new Set(d.lessons.flatMap((l) => l.services ?? []))].slice(0, 6);
          return (
            <Link className="group" key={d.id} to={`/modules/${d.id}`}>
              <Panel className="flex h-full flex-col p-7 transition-[border-color] duration-300 group-hover:border-hairline-strong">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-[13px] text-mist">
                      {x("Dominio", "Domain")} {d.code.slice(1)}
                    </p>
                    <h2 className="mt-2 text-[32px] leading-[1.1] group-hover:text-gilt-pale">{tl(d.title)}</h2>
                  </div>
                  <p className="numeral gilt-text text-[64px] leading-[0.9]">
                    {d.weight}
                    <span className="text-[28px]">%</span>
                  </p>
                </div>
                <p className="mt-4 max-w-[48ch] text-[15px] leading-relaxed text-ivory/80">{tl(d.description)}</p>
                <div className="mt-6 flex -space-x-2">
                  {icons.map((id) => (
                    <ServiceIcon className="ring-2 ring-abyss" id={id} key={id} size={34} />
                  ))}
                </div>
                <div className="mt-auto pt-7">
                  <ProgressBar label={x("Dominio", "Mastery")} value={st.mastery} />
                  <div className="mt-3 flex flex-wrap justify-between gap-2 text-[13px] text-mist">
                    <span>
                      {done} / {d.lessons.length} {x("lecciones", "lessons")}
                    </span>
                    <span>
                      {questionsByDomain(d.id).length} {x("preguntas", "questions")}
                    </span>
                    <span>
                      {Math.round(st.mastery * 100)}% {x("dominado", "mastered")}
                    </span>
                  </div>
                </div>
              </Panel>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
