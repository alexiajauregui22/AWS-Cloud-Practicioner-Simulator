import { ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Flashcard } from "@/components/study/Flashcard";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useLang } from "@/lib/i18n";
import { actions, useStore } from "@/lib/store";
import type { Flashcard as Card } from "@/lib/types";
import { shuffle } from "@/lib/utils";

/** Mazo de flashcards: las no dominadas aparecen primero */
export function Deck({ cards }: { cards: Card[] }) {
  const { x } = useLang();
  const { cardsKnown } = useStore();
  const [seed, setSeed] = useState(0);
  const ordered = useMemo(() => {
    const known = (c: Card) => (cardsKnown[c.id] ? 1 : 0);
    return [...shuffle(cards)].sort((a, b) => known(a) - known(b));
    // el orden se fija al abrir el mazo o al barajar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, seed]);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setI(0);
    setFlipped(false);
  }, [ordered]);

  if (!cards.length) return <p className="text-mist">{x("No hay tarjetas en este filtro.", "No cards in this filter.")}</p>;
  const card = ordered[Math.min(i, ordered.length - 1)];
  const knownCount = cards.filter((c) => cardsKnown[c.id]).length;

  const go = (d: number) => {
    setFlipped(false);
    setI((v) => (v + d + ordered.length) % ordered.length);
  };
  const mark = (known: boolean) => {
    actions.markCard(card.id, known);
    go(1);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:items-center">
      <div className="flex justify-center">
        <Flashcard card={card} flipped={flipped} key={card.id} onFlippedChange={setFlipped} />
      </div>
      <div className="max-w-[46ch]">
        <p className="numeral text-[18px] text-mist">
          {i + 1} <span className="text-faint">/ {ordered.length}</span>
        </p>
        <p className="mt-3 font-display text-[30px] leading-tight">
          {flipped ? x("¿La sabías?", "Did you know it?") : x("Piensa la respuesta antes de girar.", "Think of the answer before flipping.")}
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-ivory/75">
          {x(
            "Marca 'La sé' solo si la recordaste sin dudar. Las demás vuelven antes en el mazo.",
            "Mark 'I know it' only if you recalled it without hesitating. The rest come back sooner."
          )}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {flipped ? (
            <>
              <Button onClick={() => mark(true)}>{x("La sé", "I know it")}</Button>
              <Button onClick={() => mark(false)} variant="ghost">
                {x("Repasar de nuevo", "Review again")}
              </Button>
            </>
          ) : (
            <Button onClick={() => setFlipped(true)}>{x("Girar tarjeta", "Flip card")}</Button>
          )}
        </div>
        <div className="mt-6 flex items-center gap-1">
          <Button aria-label={x("Anterior", "Previous")} onClick={() => go(-1)} size="sm" variant="quiet">
            <ChevronLeft className="size-4" />
          </Button>
          <Button aria-label={x("Siguiente", "Next")} onClick={() => go(1)} size="sm" variant="quiet">
            <ChevronRight className="size-4" />
          </Button>
          <Button onClick={() => setSeed((v) => v + 1)} size="sm" variant="quiet">
            <Shuffle className="size-4" />
            {x("Barajar", "Shuffle")}
          </Button>
        </div>
        <div className="mt-8">
          <ProgressBar label={x("Tarjetas dominadas", "Cards mastered")} value={knownCount / cards.length} />
          <p className="mt-2 text-[13px] text-mist">
            {knownCount} {x("de", "of")} {cards.length} {x("dominadas", "mastered")}
          </p>
        </div>
      </div>
    </div>
  );
}
