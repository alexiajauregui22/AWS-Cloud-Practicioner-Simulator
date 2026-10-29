import { useStore } from "@/lib/store";
import type { L, Lang } from "@/lib/types";

/** Idioma actual y ayudantes de traducción */
export function useLang() {
  const lang: Lang = useStore().lang;
  return {
    lang,
    /** texto en línea: x("Hola", "Hello") */
    x: (es: string, en: string) => (lang === "es" ? es : en),
    /** texto bilingüe de los datos */
    tl: (l: L) => l[lang],
  };
}
