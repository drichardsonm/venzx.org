import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, Lock, Unlock, CheckCircle2, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SecretGate } from "@/components/SecretGate";
import { listPolls, unlockVoting, castVote, exportPollCsv } from "@/lib/civic.functions";
import { useIdentity } from "@/lib/identity";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/votaciones")({
  head: () => ({
    meta: [
      { title: "Centro de votación — Voz Anónima" },
      { name: "description", content: "Votaciones nacionales, regionales y locales verificables con resultados anonimizados descargables." },
      { property: "og:title", content: "Centro de votación — Voz Anónima" },
      { property: "og:description", content: "Vota anónimamente y audita los resultados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Votaciones,
});

type Voter = { user: number; estado: string | null; municipio: string | null; votos: { id_votacion: number; opcion_seleccionada: string }[] };
const OPTS = [
  { v: "SI", label: "Sí", cls: "bg-want text-want-foreground" },
  { v: "NO", label: "No", cls: "bg-dislike text-dislike-foreground" },
  { v: "ABSTENCION", label: "Abstención", cls: "bg-secondary text-secondary-foreground" },
] as const;

function Votaciones() {
  const fetchPolls = useServerFn(listPolls);
  const unlock = useServerFn(unlockVoting);
  const vote = useServerFn(castVote);
  const exportCsv = useServerFn(exportPollCsv);
  const id = useIdentity();
  const qc = useQueryClient();
  const polls = useQuery({ queryKey: ["polls"], queryFn: () => fetchPolls() });
  const [voter, setVoter] = useState<Voter | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function doUnlock(s: string) {
    setBusy(true);
    try {
      const r = await unlock({ data: { secret: s } });
      if (!r) { toast.error("Palabra secreta no encontrada"); return; }
      setVoter(r);
      setSecret(s);
      id.set(s, r.user);
    } finally {
      setBusy(false);
    }
  }

  async function doVote(pid: number, opcion: "SI" | "NO" | "ABSTENCION") {
    if (!secret) return;
    try {
      await vote({ data: { secret, id: pid, opcion } });
      toast.success("Voto registrado");
      await doUnlock(secret);
      qc.invalidateQueries({ queryKey: ["polls"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  async function download(pid: number) {
    const r = await exportCsv({ data: { id: pid } });
    const url = URL.createObjectURL(new Blob([r.csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria-votacion-${pid}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const all = polls.data ?? [];
  const render = (list: typeof all) => (
    <div className="space-y-3">
      {list.length === 0 && <p className="rounded-2xl border border-dashed py-10 text-center text-muted-foreground">Sin votaciones.</p>}
      {list.map((p) => {
        const mine = voter?.votos.find((v) => v.id_votacion === p.id_votacion);
        const eligible = !!voter && (!p.estado_restriccion || p.estado_restriccion === voter.estado) && (!p.municipio_restriccion || p.municipio_restriccion === voter.municipio);
        const pct = (n: number) => (p.total ? Math.round((n / p.total) * 100) : 0);
        return (
          <article key={p.id_votacion} className="rounded-2xl border bg-card p-4 shadow-soft">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={cn("rounded-full px-2 py-0.5 font-semibold", p.abierta ? "bg-want text-want-foreground" : "bg-muted text-muted-foreground")}>{p.abierta ? "Activa" : "Concluida"}</span>
              <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="size-3" />{p.municipio_restriccion ?? p.estado_restriccion ?? "Nacional"}</span>
              <span className="ml-auto text-muted-foreground">{p.abierta ? "Cierra" : "Cerró"} {new Date(p.fecha_fin).toLocaleDateString("es-VE")}</span>
            </div>
            <h3 className="mt-2 text-lg font-bold">{p.titulo}</h3>
            {p.descripcion && <p className="mt-1 text-sm text-muted-foreground">{p.descripcion}</p>}

            <div className="mt-3 space-y-1.5">
              {OPTS.map((o) => (
                <div key={o.v} className="flex items-center gap-2 text-xs">
                  <span className="w-20">{o.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className={cn("h-full", o.cls)} style={{ width: `${pct(p.resultados[o.v])}%` }} /></div>
                  <span className="w-10 text-right font-mono">{pct(p.resultados[o.v])}%</span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">{p.total} votos</p>
            </div>

            {p.abierta ? (
              mine ? (
                <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-want"><CheckCircle2 className="size-4" /> Votaste: {mine.opcion_seleccionada}</p>
              ) : !voter ? (
                <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground"><Lock className="size-4" /> Desbloquea con tu palabra secreta para votar.</p>
              ) : !eligible ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Tu perfil ({voter.municipio ?? voter.estado ?? "sin ubicación"}) no coincide con esta consulta. <Link to="/perfil" className="font-semibold text-primary underline">Actualiza tu ubicación</Link>.
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {OPTS.map((o) => (
                    <button key={o.v} onClick={() => doVote(p.id_votacion, o.v)} className={cn("rounded-xl py-2.5 text-sm font-bold shadow-soft active:scale-95", o.cls)}>{o.label}</button>
                  ))}
                </div>
              )
            ) : (
              <Button variant="outline" size="sm" className="mt-3" onClick={() => download(p.id_votacion)}><Download className="size-4" /> CSV anonimizado</Button>
            )}
          </article>
        );
      })}
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-extrabold md:text-4xl">Centro de votación</h1>
      <p className="mt-1 text-muted-foreground">Consultas convocadas por la IA o por hitos comunitarios.</p>
      <div className="mt-5">
        {voter ? (
          <div className="flex items-center gap-2 rounded-2xl border bg-card p-4 shadow-soft">
            <Unlock className="size-5 text-want" />
            <div className="text-sm"><span className="font-mono font-semibold">User #{voter.user}</span> · {[voter.municipio, voter.estado].filter(Boolean).join(", ") || "Sin ubicación"}</div>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => { setVoter(null); setSecret(null); }}>Bloquear</Button>
          </div>
        ) : (
          <SecretGate onSubmit={doUnlock} busy={busy} label="Desbloquear" hint={id.secret ? undefined : "Tu ubicación de perfil define en qué consultas regionales puedes votar."} />
        )}
        {!voter && id.secret && <Button variant="link" onClick={() => doUnlock(id.secret!)}>Usar mi identidad actual</Button>}
      </div>
      <Tabs defaultValue="nac" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="nac">🏛️ Nacionales</TabsTrigger>
          <TabsTrigger value="reg">📍 Regionales y locales</TabsTrigger>
        </TabsList>
        <TabsContent value="nac" className="mt-4">{render(all.filter((p) => p.alcance_geografico === "Nacional"))}</TabsContent>
        <TabsContent value="reg" className="mt-4">{render(all.filter((p) => p.alcance_geografico !== "Nacional"))}</TabsContent>
      </Tabs>
    </div>
  );
}
