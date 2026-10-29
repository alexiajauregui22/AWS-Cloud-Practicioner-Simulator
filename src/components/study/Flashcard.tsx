import CardFlip from "@/components/kokonutui/card-flip";
import { ServiceIcon } from "@/components/study/ServiceIcon";
import { DOMAIN_BY_ID } from "@/data/domains";
import { CATEGORY_LABEL, SERVICE_BY_ID } from "@/data/services";
import { useLang } from "@/lib/i18n";
import type { Flashcard as Card } from "@/lib/types";

export function Flashcard({
  card,
  flipped,
  onFlippedChange,
}: {
  card: Card;
  flipped: boolean;
  onFlippedChange: (v: boolean) => void;
}) {
  const { x, tl } = useLang();
  const svc = card.service ? SERVICE_BY_ID[card.service] : undefined;
  const domain = DOMAIN_BY_ID[card.domain];

  const front = (
    <div className="flex h-full flex-col bg-[radial-gradient(120%_70%_at_50%_0%,rgba(107,28,42,0.55),transparent_70%)] p-6">
      <p className="text-[12px] text-mist">{svc ? tl(CATEGORY_LABEL[svc.category]) : tl(domain.short)}</p>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        {svc ? <ServiceIcon id={svc.id} size={88} className="rounded-[18px] shadow-[0_20px_40px_-18px_rgba(0,0,0,0.9)]" /> : null}
        <h3 className="font-display text-[32px] leading-[1.1] text-ivory">{tl(card.front)}</h3>
      </div>
      <p className="text-center text-[12px] text-faint">{x("Toca o arrastra para girar", "Tap or drag to flip")}</p>
    </div>
  );

  const back = (
    <div className="flex h-full flex-col bg-[radial-gradient(120%_70%_at_50%_100%,rgba(201,162,39,0.18),transparent_70%)] p-6">
      <div className="flex items-center gap-3">
        {svc ? <ServiceIcon id={svc.id} size={32} /> : null}
        <p className="font-display text-[20px] text-gilt-pale">{tl(card.front)}</p>
      </div>
      <div className="rule my-4" />
      {svc ? (
        <div className="space-y-4 text-[15px] leading-relaxed">
          <p className="text-ivory">{tl(svc.what)}</p>
          <div>
            <p className="text-[12px] text-mist">{x("Cuándo usarlo", "When to use it")}</p>
            <p className="mt-1 text-ivory/90">{tl(svc.when)}</p>
          </div>
        </div>
      ) : (
        <p className="text-[16px] leading-relaxed text-ivory">{tl(card.back)}</p>
      )}
    </div>
  );

  return (
    <CardFlip
      back={back}
      className="w-[290px] sm:w-[330px]"
      flipped={flipped}
      front={front}
      label={tl(card.front)}
      onFlippedChange={onFlippedChange}
    />
  );
}
