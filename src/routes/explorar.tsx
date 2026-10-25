import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SlidersHorizontal, ThumbsDown, ThumbsUp, MapPin, X, ChartNoAxesCombined } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { SecretGate } from "@/components/SecretGate";
import { ProposalDetail } from "@/components/ProposalDetail";
import { listProposals, reactProposal, type FeedFilters } from "@/lib/civic.functions";
import { useIdentity } from "@/lib/identity";
import { VENEZUELA, ESTADOS, GENEROS, EDADES, CATEGORIAS } from "@/lib/venezuela";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/explorar")({
  head: () => ({
    meta: [
      { title: "Explorar propuestas — Voz Anónima" },
      { name: "description", content: "Feed de propuestas ciudadanas filtrable por género, edad, categoría y ubicación." },
      { property: "og:title", content: "Explorar propuestas — Voz Anónima" },
      { property: "og:description", content: "Descubre qué propone tu comunidad." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explorar,
});

const TONE: Record<string, string> = { Quiero: "bg-want", "Me gusta": "bg-like", "No me gusta": "bg-dislike" };

function ago(d: string) {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `hace ${Math.max(m, 1)} min`;
  if (m < 1440) return `hace ${Math.round(m / 60)} h`;
  return `hace ${Math.round(m / 1440)} d`;
}

function Filters({ f, setF }: { f: FeedFilters; setF: (f: FeedFilters) => void }) {
  return (
    <div className="space-y-3">
      <NativeSelect options={CATEGORIAS} placeholder="Todas las categorías" value={f.categoria ?? ""} onChange={(e) => setF({ ...f, categoria: e.target.value || undefined })} />
      <NativeSelect options={GENEROS} placeholder="Todos los géneros" value={f.genero ?? ""} onChange={(e) => setF({ ...f, genero: e.target.value || undefined })} />
      <NativeSelect options={EDADES} placeholder="Todas las edades" value={f.edad ?? ""} onChange={(e) => setF({ ...f, edad: e.target.value || undefined })} />
      <NativeSelect options={ESTADOS} placeholder="Toda Venezuela" value={f.estado ?? ""} onChange={(e) => setF({ ...f, estado: e.target.value || undefined, municipio: undefined })} />
      <NativeSelect disabled={!f.estado} options={f.estado ? Object.keys(VENEZUELA[f.estado] ?? {}) : []} placeholder="Todos los municipios" value={f.municipio ?? ""} onChange={(e) => setF({ ...f, municipio: e.target.value || undefined })} />
      <Button variant="ghost" className="w-full" onClick={() => setF({})}><X className="size-4" /> Limpiar filtros</Button>
    </div>
  );
}

function Explorar() {
  const [f, setF] = useState<FeedFilters>({});
  const fetchPage = useServerFn(listProposals);
  const react = useServerFn(reactProposal);
  const id = useIdentity();
  const qc = useQueryClient();
  const [pending, setPending] = useState<{ id: number; tipo: "Apoyar" | "Discrepar" } | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const q = useInfiniteQuery({
    queryKey: ["feed", f],
    queryFn: ({ pageParam }) => fetchPage({ data: { offset: pageParam, filters: f } }),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.length === 10 ? all.length * 10 : undefined),
  });
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0]?.isIntersecting && q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage());
    io.observe(el);
    return () => io.disconnect();
  }, [q]);

  async function doReact(secret: string, target: { id: number; tipo: "Apoyar" | "Discrepar" }) {
    try {
      await react({ data: { secret, ...target } });
      if (!id.secret) id.set(secret);
      setPending(null);
      toast.success(target.tipo === "Apoyar" ? "Apoyo registrado" : "Discrepancia registrada");
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["proposal-activity", target.id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  const items = q.data?.pages.flat() ?? [];
  const detailed = items.find((p) => p.id === detailId);
  const active = Object.values(f).filter(Boolean).length;

  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <aside className="hidden md:block">
        <div className="sticky top-20 rounded-2xl border bg-card p-4 shadow-soft">
          <p className="mb-3 font-display font-bold">Filtros demográficos</p>
          <Filters f={f} setF={setF} />
        </div>
      </aside>
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-extrabold md:text-4xl">Explorar</h1>
            <p className="text-sm text-muted-foreground">Lo que la gente está proponiendo ahora.</p>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden"><SlidersHorizontal className="size-4" /> Filtros{active ? ` (${active})` : ""}</Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader><SheetTitle>Filtros demográficos</SheetTitle></SheetHeader>
              <div className="p-4"><Filters f={f} setF={setF} /></div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="space-y-3">
          {items.map((p) => (
            <article key={p.id} className="rounded-2xl border bg-card p-4 shadow-soft">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={cn("size-2.5 rounded-full", TONE[p.tipo])} />
                <span className="font-semibold">{p.tipo}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 font-medium">{p.categoria}</span>
                <span className="ml-auto text-muted-foreground">{ago(p.fecha)}</span>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed">{p.contenido}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">User #{p.user}</span>
                {p.lugar && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{p.lugar}</span>}
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => (id.secret ? doReact(id.secret, { id: p.id, tipo: "Apoyar" }) : setPending({ id: p.id, tipo: "Apoyar" }))}>
                    <ThumbsUp className="size-4 text-want" /> {p.apoyos}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => (id.secret ? doReact(id.secret, { id: p.id, tipo: "Discrepar" }) : setPending({ id: p.id, tipo: "Discrepar" }))}>
                    <ThumbsDown className="size-4 text-dislike" /> {p.discrepa}
                  </Button>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setDetailId(p.id)} aria-label={`Ver detalle de propuesta ${p.id}`}>
                <ChartNoAxesCombined className="size-4" /> Ver detalle
              </Button>
            </article>
          ))}
          {q.isLoading && <p className="py-10 text-center text-muted-foreground">Cargando…</p>}
          {!q.isLoading && items.length === 0 && <p className="rounded-2xl border border-dashed py-12 text-center text-muted-foreground">No hay propuestas con estos filtros.</p>}
          <div ref={sentinel} className="h-10" />
          {q.isFetchingNextPage && <p className="text-center text-sm text-muted-foreground">Cargando más…</p>}
        </div>
      </section>

      <Dialog open={!!detailed} onOpenChange={(o) => !o && setDetailId(null)}>
        {detailed && <ProposalDetail proposal={detailed} />}
      </Dialog>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{pending?.tipo === "Apoyar" ? "👍 Apoyar" : "👎 Discrepar"} propuesta</DialogTitle></DialogHeader>
          <SecretGate label="Confirmar" onSubmit={(s) => pending && doReact(s, pending)} hint="Un voto por identidad por propuesta." />
        </DialogContent>
      </Dialog>
    </div>
  );
}
