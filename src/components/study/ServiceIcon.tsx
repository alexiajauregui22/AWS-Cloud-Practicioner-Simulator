import { SERVICE_BY_ID } from "@/data/services";
import { cn } from "@/lib/utils";

// Iconos oficiales de AWS Architecture Icons (paquete aws-icons), copiados a assets
const ICONS = import.meta.glob<string>("../../assets/icons/aws/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

const byName: Record<string, string> = Object.fromEntries(
  Object.entries(ICONS).map(([path, url]) => [path.split("/").pop()!.replace(".svg", ""), url])
);

export function ServiceIcon({ id, size = 40, className }: { id: string; size?: number; className?: string }) {
  const s = SERVICE_BY_ID[id];
  const url = s ? byName[s.icon] : undefined;
  if (!url) return null;
  return (
    <img
      alt=""
      className={cn("shrink-0 rounded-[8px]", className)}
      draggable={false}
      height={size}
      src={url}
      width={size}
    />
  );
}

export function ServiceChip({ id, onClick }: { id: string; onClick?: () => void }) {
  const s = SERVICE_BY_ID[id];
  if (!s) return null;
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      className="inline-flex items-center gap-2 rounded-full border border-hairline bg-abyss/50 py-1 pr-3 pl-1 text-[13px] text-ivory transition-colors hover:border-hairline-strong"
      onClick={onClick}
      type={onClick ? "button" : undefined}
    >
      <ServiceIcon id={id} size={22} className="rounded-full" />
      {s.name}
    </Tag>
  );
}
