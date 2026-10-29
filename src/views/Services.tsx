import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ServiceIcon } from "@/components/study/ServiceIcon";
import { Panel } from "@/components/ui/Panel";
import { DOMAINS } from "@/data/domains";
import { QUESTIONS } from "@/data/questions";
import { CATEGORY_LABEL, SERVICES } from "@/data/services";
import { useLang } from "@/lib/i18n";
import type { Service, ServiceCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Services() {
  const { x, tl } = useLang();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<ServiceCategory | "all">("all");
  const [open, setOpen] = useState<Service | null>(null);

  const cats = useMemo(() => [...new Set(SERVICES.map((s) => s.category))], []);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SERVICES.filter((s) => (cat === "all" || s.category === cat) && (!q || `${s.name} ${tl(s.what)}`.toLowerCase().includes(q)));
  }, [query, cat, tl]);
  const grouped = useMemo(() => cats.map((c) => ({ c, items: list.filter((s) => s.category === c) })).filter((g) => g.items.length), [cats, list]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const lessonsFor = (id: string) => DOMAINS.flatMap((d) => d.lessons.filter((l) => l.services?.includes(id)).map((l) => ({ d, l })));
  const qCount = (id: string) => QUESTIONS.filter((q) => q.services?.includes(id)).length;

  return (
    <div>
      <header className="mb-8 max-w-[64ch]">
        <h1 className="text-[44px] leading-[1.05] sm:text-[56px]">{x("Servicios de AWS", "AWS services")}</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-mist">
          {x(
            `Los ${SERVICES.length} servicios que más aparecen en el examen, con sus iconos oficiales de arquitectura. Aprende a reconocerlos y a saber cuándo usar cada uno.`,
            `The ${SERVICES.length} services that show up most on the exam, with their official architecture icons. Learn to recognize them and when to use each.`
          )}
        </p>
      </header>

      <div className="mb-8 flex flex-col gap-4">
        <label className="surface flex max-w-[520px] items-center gap-3 rounded-full px-5 py-3">
          <Search className="size-4 text-mist" />
          <input
            className="w-full bg-transparent text-[15px] text-ivory placeholder:text-faint focus:outline-none"
            onChange={(e) => setQuery(e.target.value)}
            placeholder={x("Busca por nombre o función, por ejemplo 'DDoS'", "Search by name or job, for example 'DDoS'")}
            value={query}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {(["all", ...cats] as const).map((c) => (
            <button
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[13px] transition-colors",
                cat === c ? "border-gilt bg-gilt text-abyss" : "border-hairline text-mist hover:text-ivory"
              )}
              key={c}
              onClick={() => setCat(c)}
              type="button"
            >
              {c === "all" ? x("Todas", "All") : tl(CATEGORY_LABEL[c])}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-10">
        {grouped.map(({ c, items }) => (
          <section key={c}>
            <h2 className="mb-4 text-[26px]">{tl(CATEGORY_LABEL[c])}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {items.map((s) => (
                <button
                  className="surface group flex flex-col items-start gap-4 rounded-[16px] p-4 text-left transition-[border-color] hover:border-hairline-strong"
                  key={s.id}
                  onClick={() => setOpen(s)}
                  type="button"
                >
                  <ServiceIcon id={s.id} size={48} className="rounded-[11px]" />
                  <span>
                    <span className="block text-[14.5px] font-semibold leading-snug group-hover:text-gilt-pale">{s.name}</span>
                    <span className="mt-1 line-clamp-2 block text-[12.5px] leading-snug text-mist">{tl(s.what)}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
        {!grouped.length ? <p className="text-mist">{x("Ningún servicio coincide con tu búsqueda.", "No service matches your search.")}</p> : null}
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-abyss/60 backdrop-blur-sm" exit={{ opacity: 0 }} initial={{ opacity: 0 }} onClick={() => setOpen(null)}>
            <motion.aside
              animate={{ x: 0 }}
              aria-label={open.name}
              className="absolute inset-y-0 right-0 w-full max-w-[460px] overflow-y-auto border-hairline border-l bg-plum-deep/95 p-7 backdrop-blur-xl"
              exit={{ x: "100%" }}
              initial={{ x: "100%" }}
              onClick={(e) => e.stopPropagation()}
              transition={{ type: "spring", stiffness: 320, damping: 36 }}
            >
              <button aria-label={x("Cerrar", "Close")} className="absolute top-5 right-5 rounded-full p-2 text-mist hover:text-ivory" onClick={() => setOpen(null)} type="button">
                <X className="size-5" />
              </button>
              <ServiceIcon id={open.id} size={72} className="rounded-[16px]" />
              <h2 className="mt-6 text-[36px] leading-tight">{open.name}</h2>
              <p className="mt-1 text-[13px] text-mist">{tl(CATEGORY_LABEL[open.category])}</p>
              <div className="rule my-6" />
              <p className="text-[13px] text-mist">{x("Qué es", "What it is")}</p>
              <p className="mt-1.5 text-[16px] leading-relaxed">{tl(open.what)}</p>
              <p className="mt-6 text-[13px] text-mist">{x("Cuándo usarlo", "When to use it")}</p>
              <p className="mt-1.5 text-[16px] leading-relaxed">{tl(open.when)}</p>
              <Panel className="mt-8 p-5" tone="inset">
                <p className="text-[14px]">
                  {qCount(open.id)} {x("preguntas del banco lo mencionan.", "questions in the bank mention it.")}
                </p>
                {lessonsFor(open.id).length ? (
                  <ul className="mt-3 space-y-2">
                    {lessonsFor(open.id).map(({ d, l }) => (
                      <li key={l.id}>
                        <Link className="text-[14px] text-gilt-pale hover:underline" to={`/modules/${d.id}`}>
                          {tl(l.title)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Panel>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
