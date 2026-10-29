import {
  BookOpen,
  Boxes,
  CalendarRange,
  GalleryVerticalEnd,
  Gauge as GaugeIcon,
  Home,
  Layers,
  LineChart,
  Settings,
  Timer,
} from "lucide-react";
import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Backdrop } from "@/components/backgrounds/Backdrop";
import { useLang } from "@/lib/i18n";
import { level, streak } from "@/lib/stats";
import { actions, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const NAV = [
  { to: "/", es: "Inicio", en: "Home", icon: Home, main: true },
  { to: "/modules", es: "Módulos", en: "Modules", icon: BookOpen, main: true },
  { to: "/practice", es: "Práctica", en: "Practice", icon: Layers, main: true },
  { to: "/exam", es: "Simulacro", en: "Mock exam", icon: Timer, main: true },
  { to: "/flashcards", es: "Flashcards", en: "Flashcards", icon: GalleryVerticalEnd, main: false },
  { to: "/services", es: "Servicios AWS", en: "AWS services", icon: Boxes, main: false },
  { to: "/roadmap", es: "Roadmap", en: "Roadmap", icon: CalendarRange, main: true },
  { to: "/progress", es: "Progreso", en: "Progress", icon: LineChart, main: false },
  { to: "/settings", es: "Ajustes", en: "Settings", icon: Settings, main: false },
];

function LangToggle() {
  const { lang } = useLang();
  return (
    <div aria-label="Idioma / Language" className="inline-flex rounded-full border border-hairline p-0.5 text-[12px] font-semibold" role="group">
      {(["es", "en"] as const).map((l) => (
        <button
          aria-pressed={lang === l}
          className={cn("rounded-full px-3 py-1 transition-colors", lang === l ? "bg-gilt text-abyss" : "text-mist hover:text-ivory")}
          key={l}
          onClick={() => actions.setLang(l)}
          type="button"
        >
          {l === "es" ? "Español" : "English"}
        </button>
      ))}
    </div>
  );
}

function Wordmark() {
  return (
    <div className="leading-none">
      <p className="font-display text-[30px] text-ivory italic">Ascend</p>
      <p className="mt-1 text-[12px] text-mist">Cloud Practitioner CLF-C02</p>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const s = useStore();
  const { x } = useLang();
  const lv = level(s.xp);
  const st = streak(s.activity);
  const loc = useLocation();
  const inExam = loc.pathname.startsWith("/exam/run");

  return (
    <div className="relative isolate min-h-dvh">
      <Backdrop />
      <a className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-gilt focus:px-4 focus:py-2 focus:text-abyss" href="#main">
        {x("Saltar al contenido", "Skip to content")}
      </a>

      {/* Barra lateral */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-hairline border-r bg-abyss/55 px-5 py-7 backdrop-blur-xl lg:flex",
          inExam && "lg:hidden"
        )}
      >
        <Wordmark />
        <nav aria-label={x("Navegación principal", "Main navigation")} className="mt-10 flex flex-col gap-0.5">
          {NAV.map((n) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[14px] font-medium transition-colors",
                  isActive ? "bg-gilt/12 text-gilt-pale" : "text-mist hover:bg-ivory/5 hover:text-ivory"
                )
              }
              end={n.to === "/"}
              key={n.to}
              to={n.to}
            >
              <n.icon aria-hidden className="size-[18px] stroke-[1.6]" />
              {x(n.es, n.en)}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-5">
          <div className="inset rounded-[14px] p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-[12px] text-mist">{x("Nivel", "Level")}</p>
              <p className="numeral text-[22px] text-gilt-pale">{lv.lv}</p>
            </div>
            <div className="mt-2 h-1 rounded-full bg-ivory/10">
              <div className="h-full rounded-full bg-gilt" style={{ width: `${Math.round(lv.progress * 100)}%` }} />
            </div>
            <div className="mt-3 flex justify-between text-[12px] text-mist">
              <span>
                {s.xp.toLocaleString()} XP
              </span>
              <span>
                {st} {x(st === 1 ? "día de racha" : "días de racha", st === 1 ? "day streak" : "day streak")}
              </span>
            </div>
          </div>
          <LangToggle />
        </div>
      </aside>

      {/* Barra superior móvil */}
      {!inExam ? (
        <header className="sticky top-0 z-30 flex items-center justify-between border-hairline border-b bg-abyss/70 px-4 py-3 backdrop-blur-xl lg:hidden">
          <Wordmark />
          <LangToggle />
        </header>
      ) : null}

      <main className={cn("relative px-4 pt-6 pb-28 sm:px-8 lg:pb-16", !inExam && "lg:ml-[248px] lg:px-12 lg:pt-10")} id="main">
        <div className="mx-auto max-w-[1180px]">{children}</div>
      </main>

      {/* Navegación inferior móvil */}
      {!inExam ? (
        <nav
          aria-label={x("Navegación", "Navigation")}
          className="fixed inset-x-3 bottom-3 z-30 flex justify-between rounded-full border border-hairline bg-abyss/80 px-2 py-1.5 backdrop-blur-xl lg:hidden"
        >
          {NAV.filter((n) => n.main).map((n) => (
            <NavLink
              className={({ isActive }) =>
                cn("flex flex-1 flex-col items-center gap-0.5 rounded-full py-1.5 text-[10.5px] font-semibold", isActive ? "text-gilt-pale" : "text-mist")
              }
              end={n.to === "/"}
              key={n.to}
              to={n.to}
            >
              <n.icon aria-hidden className="size-[19px] stroke-[1.6]" />
              {x(n.es, n.en)}
            </NavLink>
          ))}
          <NavLink
            className={({ isActive }) => cn("flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10.5px] font-semibold", isActive ? "text-gilt-pale" : "text-mist")}
            to="/more"
          >
            <GaugeIcon aria-hidden className="size-[19px] stroke-[1.6]" />
            {x("Más", "More")}
          </NavLink>
        </nav>
      ) : null}
    </div>
  );
}
