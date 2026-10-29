import { Link } from "react-router-dom";
import { NAV } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { useLang } from "@/lib/i18n";

export default function More() {
  const { x } = useLang();
  return (
    <div>
      <h1 className="mb-6 text-[44px]">{x("Más", "More")}</h1>
      <Panel className="divide-y divide-hairline">
        {NAV.map((n) => (
          <Link className="flex items-center gap-4 px-5 py-4 text-[16px] hover:text-gilt-pale" key={n.to} to={n.to}>
            <n.icon aria-hidden className="size-5 stroke-[1.6] text-mist" />
            {x(n.es, n.en)}
          </Link>
        ))}
      </Panel>
    </div>
  );
}
