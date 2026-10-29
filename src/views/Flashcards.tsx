import { useMemo, useState } from "react";
import { Deck } from "@/components/study/Deck";
import { Panel } from "@/components/ui/Panel";
import { Segmented } from "@/components/ui/Segmented";
import { DOMAINS } from "@/data/domains";
import { FLASHCARDS } from "@/data/flashcards";
import { useLang } from "@/lib/i18n";
import type { DomainId } from "@/lib/types";

type F = DomainId | "all" | "concepts-only";

export default function Flashcards() {
  const { x, tl } = useLang();
  const [f, setF] = useState<F>("all");
  const [kind, setKind] = useState<"all" | "services" | "ideas">("all");
  const cards = useMemo(
    () =>
      FLASHCARDS.filter((c) => (f === "all" ? true : c.domain === f)).filter((c) =>
        kind === "all" ? true : kind === "services" ? !!c.service : !c.service
      ),
    [f, kind]
  );
  return (
    <div>
      <header className="mb-8 max-w-[62ch]">
        <h1 className="text-[44px] leading-[1.05] sm:text-[56px]">Flashcards</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-mist">
          {x(
            "Repaso activo: intenta recordar la respuesta antes de girar. Hay una tarjeta por cada servicio de AWS del temario, con su icono oficial, y tarjetas de conceptos clave.",
            "Active recall: try to remember the answer before flipping. There's a card for every AWS service in scope, with its official icon, plus key concept cards."
          )}
        </p>
      </header>
      <div className="mb-6 flex flex-wrap gap-3">
        <Segmented
          label={x("Dominio", "Domain")}
          onChange={setF}
          options={[{ value: "all" as F, label: x("Todos", "All") }, ...DOMAINS.map((d) => ({ value: d.id as F, label: tl(d.short) }))]}
          value={f}
        />
        <Segmented
          label={x("Tipo", "Type")}
          onChange={setKind}
          options={[
            { value: "all", label: x("Todo", "Everything") },
            { value: "services", label: x("Servicios", "Services") },
            { value: "ideas", label: x("Conceptos", "Concepts") },
          ]}
          value={kind}
        />
      </div>
      <Panel className="p-6 sm:p-10">
        <Deck cards={cards} />
      </Panel>
    </div>
  );
}
