import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Sparkles, Trophy, ThumbsUp } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Cell } from "recharts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getInsights } from "@/lib/civic.functions";
import { TILES, ESTADOS } from "@/lib/venezuela";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa de calor e IA — Voz Anónima" },
      { name: "description", content: "Mapa de Venezuela con prioridades ciudadanas, nube de temas y propuesta más apoyada analizadas por IA." },
      { property: "og:title", content: "Mapa de calor e IA — Voz Anónima" },
      { property: "og:description", content: "Pregunta en lenguaje natural qué necesita cada región." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Mapa,
});

const HEAT = ["fill-heat-0", "fill-heat-1", "fill-heat-2", "fill-heat-3", "fill-heat-4"];
const BARS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

function Mapa() {
  const fetchInsights = useServerFn(getInsights);
  const [estado, setEstado] = useState<string | undefined>();
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const q = useQuery({
    queryKey: ["insights", estado, query],
    queryFn: () => fetchInsights({ data: { estado, query: query || undefined } }),
    staleTime: 60_000,
  });
  const byState = q.data?.byState ?? {};
  const max = Math.max(1, ...Object.values(byState));

  function ask(e: React.FormEvent) {
    e.preventDefault();
    const found = ESTADOS.find((s) => draft.toLowerCase().includes(s.toLowerCase())) ??
      (/(san crist[oó]bal)/i.test(draft) ? "Táchira" : /maracaibo/i.test(draft) ? "Zulia" : /caracas/i.test(draft) ? "Distrito Capital" : undefined);
    if (found) setEstado(found);
    setQuery(draft);
  }

  const maxW = Math.max(1, ...(q.data?.insight.palabras ?? []).map((w) => w.peso));

  return (
    <div>
      <h1 className="text-3xl font-extrabold md:text-4xl">Mapa e insights</h1>
      <form onSubmit={ask} className="mt-4 flex gap-2 rounded-2xl border bg-card p-2 shadow-soft">
        <Search className="ml-2 mt-3 size-4 shrink-0 text-muted-foreground" />
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="¿Qué necesitan los jóvenes en San Cristóbal?" className="h-10 border-0 shadow-none focus-visible:ring-0" />
        <Button type="submit" className="h-10"><Sparkles className="size-4" /> Preguntar</Button>
      </form>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border bg-card p-4 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-display font-bold">{estado ?? "Toda Venezuela"}</p>
            {estado && <button className="text-sm text-primary underline" onClick={() => { setEstado(undefined); setQuery(""); setDraft(""); }}>Ver país</button>}
          </div>
          <svg viewBox="0 0 500 260" className="w-full" role="img" aria-label="Mapa de Venezuela por estados">
            {Object.entries(TILES).map(([name, [c, r, code]]) => {
              const n = byState[name] ?? 0;
              const lvl = n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4));
              const x = c * 50 + (r % 2) * 0, y = r * 50 + 5;
              return (
                <g key={name} className="cursor-pointer" onClick={() => setEstado(name === estado ? undefined : name)}>
                  <title>{`${name}: ${n} propuestas`}</title>
                  <rect x={x + 2} y={y} width={46} height={46} rx={10} className={cn(HEAT[lvl], "stroke-card transition-opacity hover:opacity-80", estado === name && "stroke-primary")} strokeWidth={estado === name ? 3 : 2} />
                  <text x={x + 25} y={y + 22} textAnchor="middle" className="fill-foreground font-mono text-[10px] font-semibold">{code}</text>
                  <text x={x + 25} y={y + 36} textAnchor="middle" className="fill-foreground text-[10px] opacity-70">{n}</text>
                </g>
              );
            })}
          </svg>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            Menos {HEAT.map((h) => <svg key={h} className="size-3"><rect width="12" height="12" rx="3" className={h} /></svg>)} Más
          </div>
        </div>

        <div className="space-y-4">
          {q.isFetching && <div className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground"><Sparkles className="mr-1 inline size-4 animate-pulse" /> La IA está analizando…</div>}
          {q.data && (
            <>
              {q.data.insight.resumen && (
                <div className="rounded-2xl bg-ink p-4 text-primary-foreground shadow-soft">
                  <p className="mb-1 flex items-center gap-1 text-xs uppercase tracking-widest opacity-75"><Sparkles className="size-3.5" /> {q.data.ai ? "Lectura IA" : "Resumen"}</p>
                  <p className="text-sm leading-relaxed">{q.data.insight.resumen}</p>
                </div>
              )}
              <div className="rounded-2xl border bg-card p-4 shadow-soft">
                <p className="font-display font-bold">Top 3 prioridades urgentes</p>
                <div className="h-40">
                  <ResponsiveContainer>
                    <BarChart data={q.data.insight.prioridades} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="tema" width={110} tick={{ fontSize: 12, fill: "var(--foreground)" }} axisLine={false} tickLine={false} />
                      <Bar dataKey="puntaje" radius={[0, 8, 8, 0]}>
                        {q.data.insight.prioridades.map((_, i) => <Cell key={i} fill={BARS[i % 3]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-soft">
                <p className="mb-3 font-display font-bold">Nube de temas</p>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {q.data.insight.palabras.map((w, i) => (
                    <span key={w.texto} className={cn("font-display font-bold", i % 3 === 0 ? "text-primary" : i % 3 === 1 ? "text-heat-3" : "text-like")} style={{ fontSize: `${0.8 + (w.peso / maxW) * 1.1}rem` }}>
                      {w.texto}
                    </span>
                  ))}
                  {!q.data.insight.palabras.length && <span className="text-sm text-muted-foreground">Sin datos aún.</span>}
                </div>
              </div>
              <div className="rounded-2xl border-2 border-sun bg-card p-4 shadow-soft">
                <p className="flex items-center gap-1 font-display font-bold"><Trophy className="size-4 text-heat-2" /> Más apoyada de la semana</p>
                {q.data.top ? (
                  <>
                    <p className="mt-2 text-sm leading-relaxed">{q.data.top.contenido}</p>
                    <p className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono">User #{q.data.top.user}</span>
                      <span>{q.data.top.lugar}</span>
                      <span className="ml-auto flex items-center gap-1 font-semibold text-want"><ThumbsUp className="size-3.5" />{q.data.top.apoyos}</span>
                    </p>
                  </>
                ) : <p className="mt-2 text-sm text-muted-foreground">Aún no hay propuestas en esta región.</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
