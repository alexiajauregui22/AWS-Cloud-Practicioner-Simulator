import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Segmented } from "@/components/ui/Segmented";
import { dayKey } from "@/lib/dates";
import { useLang } from "@/lib/i18n";
import { actions, getState, useStore } from "@/lib/store";

export default function SettingsView() {
  const s = useStore();
  const { x } = useLang();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ascend-progreso-${dayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = async (f: File) => {
    try {
      actions.importState(await f.text());
      setMsg(x("Progreso importado.", "Progress imported."));
    } catch {
      setMsg(x("El archivo no es un respaldo válido de Ascend.", "That file isn't a valid Ascend backup."));
    }
  };

  const field = "w-full rounded-[12px] border border-hairline bg-abyss/60 px-4 py-3 text-[15px] text-ivory focus:border-gilt focus:outline-none";

  return (
    <div className="max-w-[760px]">
      <h1 className="mb-8 text-[44px] leading-[1.05] sm:text-[56px]">{x("Ajustes", "Settings")}</h1>
      <Panel className="space-y-7 p-6 sm:p-9">
        <div>
          <label className="mb-2 block text-[14px]" htmlFor="name">
            {x("Tu nombre", "Your name")}
          </label>
          <input className={field} id="name" onChange={(e) => actions.setName(e.target.value)} placeholder={x("Para saludarte en el inicio", "So we can greet you")} value={s.name} />
        </div>
        <div>
          <label className="mb-2 block text-[14px]" htmlFor="date">
            {x("Fecha de tu examen", "Your exam date")}
          </label>
          <input className={field} id="date" onChange={(e) => e.target.value && actions.setExamDate(e.target.value)} type="date" value={s.examDate} />
          <p className="mt-2 text-[13px] text-mist">{x("El roadmap se ajusta a esta fecha.", "The roadmap adapts to this date.")}</p>
        </div>
        <div>
          <p className="mb-2 text-[14px]">{x("Meta diaria de actividades", "Daily activity goal")}</p>
          <Segmented
            label={x("Meta diaria", "Daily goal")}
            onChange={(v) => actions.setDailyGoal(Number(v))}
            options={["10", "20", "30", "50"].map((v) => ({ value: v, label: v }))}
            value={String(s.dailyGoal)}
          />
        </div>
        <div>
          <p className="mb-2 text-[14px]">{x("Idioma", "Language")}</p>
          <Segmented
            label={x("Idioma", "Language")}
            onChange={actions.setLang}
            options={[
              { value: "es", label: "Español" },
              { value: "en", label: "English" },
            ]}
            value={s.lang}
          />
        </div>
      </Panel>

      <Panel className="mt-6 p-6 sm:p-9">
        <h2 className="text-[26px]">{x("Tus datos", "Your data")}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-mist">
          {x(
            "Todo se guarda solo en este navegador. Exporta un respaldo si vas a cambiar de computadora o borrar los datos del navegador.",
            "Everything is stored only in this browser. Export a backup if you'll switch computers or clear browser data."
          )}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={exportData} variant="ghost">
            {x("Exportar progreso", "Export progress")}
          </Button>
          <Button onClick={() => file.current?.click()} variant="ghost">
            {x("Importar progreso", "Import progress")}
          </Button>
          <input accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} ref={file} type="file" />
          {confirmReset ? (
            <>
              <Button
                onClick={() => {
                  actions.reset();
                  setConfirmReset(false);
                  setMsg(x("Progreso borrado.", "Progress cleared."));
                }}
                variant="danger"
              >
                {x("Sí, borrar todo", "Yes, delete everything")}
              </Button>
              <Button onClick={() => setConfirmReset(false)} variant="quiet">
                {x("Cancelar", "Cancel")}
              </Button>
            </>
          ) : (
            <Button onClick={() => setConfirmReset(true)} variant="danger">
              {x("Borrar progreso", "Delete progress")}
            </Button>
          )}
        </div>
        {msg ? <p className="mt-4 text-[14px] text-gilt-pale">{msg}</p> : null}
      </Panel>
    </div>
  );
}
