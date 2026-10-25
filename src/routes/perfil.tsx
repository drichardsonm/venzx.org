import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { SecretGate } from "@/components/SecretGate";
import { loadProfile, saveProfile } from "@/lib/civic.functions";
import { useIdentity } from "@/lib/identity";
import { VENEZUELA, ESTADOS, GENEROS, EDADES, INTERESES } from "@/lib/venezuela";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil anónimo — Voz Anónima" },
      { name: "description", content: "Carga tu identidad con tu palabra secreta y añade datos demográficos anónimos." },
      { property: "og:title", content: "Perfil anónimo — Voz Anónima" },
      { property: "og:description", content: "Tu identidad es solo un número." },
    ],
  }),
  component: Perfil,
});

type P = { genero: string | null; edad_rango: string | null; estado: string | null; municipio: string | null; parroquia: string | null; intereses: string[] };
const EMPTY: P = { genero: null, edad_rango: null, estado: null, municipio: null, parroquia: null, intereses: [] };

function Perfil() {
  const id = useIdentity();
  const load = useServerFn(loadProfile);
  const save = useServerFn(saveProfile);
  const [p, setP] = useState<P | null>(null);
  const [busy, setBusy] = useState(false);

  async function open(secret: string, create = false) {
    setBusy(true);
    try {
      const r = await load({ data: { secret, create } });
      if (!r) {
        toast("Esa palabra no existe todavía", { action: { label: "Crear identidad", onClick: () => open(secret, true) } });
        return;
      }
      id.set(secret, r.id_correlativo);
      setP({ ...EMPTY, ...r, intereses: r.intereses ?? [] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (id.secret && !p) open(id.secret);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id.secret]);

  const set = (k: keyof P, v: string) => setP((x) => (x ? { ...x, [k]: v || null } : x));

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-extrabold md:text-4xl">Perfil anónimo</h1>
      <p className="mt-1 text-muted-foreground">Solo datos demográficos. Nunca te pediremos nombre, correo ni teléfono.</p>

      {!id.secret || !p ? (
        <div className="mt-6">
          <SecretGate onSubmit={(s) => open(s)} label="Cargar" busy={busy} hint="Usa la palabra de tu ticket, o escribe una nueva para crear identidad." />
        </div>
      ) : (
        <form
          className="mt-6 space-y-5 rounded-3xl border bg-card p-5 shadow-soft"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await save({ data: { secret: id.secret!, ...p } });
              toast.success("Perfil actualizado");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Error");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Identidad</p>
              <p className="font-mono text-2xl font-semibold">User #{id.userNumber}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => { id.set(null); setP(null); }}>
              <LogOut className="size-4" /> Salir
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Género"><NativeSelect options={GENEROS} placeholder="Prefiero no decir" value={p.genero ?? ""} onChange={(e) => set("genero", e.target.value)} /></Field>
            <Field label="Edad"><NativeSelect options={EDADES} placeholder="—" value={p.edad_rango ?? ""} onChange={(e) => set("edad_rango", e.target.value)} /></Field>
          </div>
          <Field label="Intereses">
            <div className="flex flex-wrap gap-2">
              {INTERESES.map((t) => {
                const on = p.intereses.includes(t);
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setP({ ...p, intereses: on ? p.intereses.filter((x) => x !== t) : [...p.intereses, t] })}
                    className={cn("flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition", on ? "border-primary bg-primary text-primary-foreground" : "bg-background")}
                  >
                    {on && <Check className="size-3.5" />} {t}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Ubicación">
            <div className="space-y-2">
              <NativeSelect options={ESTADOS} placeholder="Estado" value={p.estado ?? ""} onChange={(e) => setP({ ...p, estado: e.target.value || null, municipio: null, parroquia: null })} />
              <NativeSelect disabled={!p.estado} options={p.estado ? Object.keys(VENEZUELA[p.estado] ?? {}) : []} placeholder="Municipio" value={p.municipio ?? ""} onChange={(e) => setP({ ...p, municipio: e.target.value || null, parroquia: null })} />
              <NativeSelect disabled={!p.municipio} options={p.estado && p.municipio ? VENEZUELA[p.estado]?.[p.municipio] ?? [] : []} placeholder="Parroquia" value={p.parroquia ?? ""} onChange={(e) => set("parroquia", e.target.value)} />
            </div>
          </Field>
          <Button type="submit" className="h-12 w-full text-base" disabled={busy}>{busy ? "Guardando…" : "Guardar perfil"}</Button>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">{label}</p>
      {children}
    </div>
  );
}
