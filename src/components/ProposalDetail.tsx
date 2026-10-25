import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, type TooltipProps } from "recharts";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { getProposalActivity } from "@/lib/civic.functions";
import { activityDate, publicAuthor, supportSeries } from "@/lib/proposal-activity";

type Proposal = { id: number; user: number; contenido: string; categoria: string; apoyos: number; discrepa: number };
type Point = ReturnType<typeof supportSeries>[number];

function ActivityTooltip({ active, payload }: TooltipProps<number, string>) {
  const point = payload?.[0]?.payload as Point | undefined;
  if (!active || !point?.timestamp) return null;
  return <div className="max-w-64 rounded-lg border bg-popover p-3 text-xs text-popover-foreground shadow-soft" role="status">
    <p className="font-mono font-semibold">{publicAuthor(point.user)}</p>
    <p className={point.action === "Apoyar" ? "mt-1 font-semibold text-want" : "mt-1 font-semibold text-dislike"}>{point.action === "Apoyar" ? "Apoyó" : "Discrepó"}</p>
    <p className="mt-1 whitespace-normal text-muted-foreground">{activityDate(point.timestamp)}</p>
    <p className="mt-2 border-t pt-2">{point.cumulative} apoyos acumulados</p>
  </div>;
}

const shortDate = (time: number) => new Intl.DateTimeFormat("es-VE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Caracas" }).format(new Date(time));

export function ProposalDetail({ proposal }: { proposal: Proposal }) {
  const load = useServerFn(getProposalActivity);
  const q = useQuery({ queryKey: ["proposal-activity", proposal.id], queryFn: () => load({ data: { id: proposal.id } }) });
  const events = q.data ?? [];
  const series = supportSeries(events);
  const historical = events.filter((e) => !e.timestamp).length;

  return <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-lg p-4 sm:p-6">
    <DialogHeader className="pr-6 text-left">
      <DialogTitle>Detalle de propuesta</DialogTitle>
      <DialogDescription>{proposal.categoria} · {publicAuthor(proposal.user)}</DialogDescription>
    </DialogHeader>
    <p className="break-words text-base leading-relaxed">{proposal.contenido}</p>
    <div className="flex flex-wrap gap-4 border-b pb-4 text-sm">
      <span className="flex items-center gap-1.5"><ThumbsUp className="size-4 text-want" />{proposal.apoyos} apoyos actuales</span>
      <span className="flex items-center gap-1.5"><ThumbsDown className="size-4 text-dislike" />{proposal.discrepa} discrepancias</span>
    </div>
    {q.isPending ? <p className="py-12 text-center text-muted-foreground">Cargando actividad…</p> : q.isError ?
      <div className="py-8 text-center"><p role="alert">No se pudo cargar la actividad.</p><Button variant="outline" className="mt-3" onClick={() => q.refetch()}>Reintentar</Button></div> : <>
      <section className="min-w-0" aria-label="Apoyos acumulados">
        <h3 className="font-semibold">Apoyos acumulados</h3>
        <p className="mb-4 text-xs text-muted-foreground">Hora de Venezuela (UTC−4)</p>
        {series.length ? <ChartContainer config={{ cumulative: { label: "Apoyos acumulados", color: "var(--want)" } }} className="h-60 w-full aspect-auto">
          <LineChart data={series} accessibilityLayer margin={{ top: 12, right: 16, bottom: 12, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} tickFormatter={shortDate} tickLine={false} axisLine={false} minTickGap={40} tickCount={3} />
            <YAxis allowDecimals={false} domain={[0, 'auto']} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ActivityTooltip />} />
            <Line type="linear" dataKey="cumulative" stroke="var(--color-cumulative)" strokeWidth={2} dot={{ r: 4, fill: "var(--want)", stroke: "var(--background)" }} activeDot={{ r: 6 }} isAnimationActive={false} />
          </LineChart>
        </ChartContainer> : <p className="border-y py-10 text-center text-sm text-muted-foreground">Aún no hay interacciones con fecha registrada.</p>}
        {historical > 0 && <p className="mt-2 text-xs text-muted-foreground">{historical} interacciones anteriores sin fecha disponible; sus apoyos se incluyen en el saldo inicial.</p>}
      </section>
      <section aria-label="Registro de actividad">
        <h3 className="mb-2 font-semibold">Registro de actividad</h3>
        {events.length ? <ol className="divide-y">{[...events].reverse().map((event) => <li key={event.id} className="flex gap-3 py-3 text-sm">
          {event.action === "Apoyar" ? <ThumbsUp className="mt-0.5 size-4 shrink-0 text-want" /> : <ThumbsDown className="mt-0.5 size-4 shrink-0 text-dislike" />}
          <div className="min-w-0"><p><span className="font-mono font-medium">{publicAuthor(event.user)}</span> {event.action === "Apoyar" ? "apoyó" : "discrepó"} esta propuesta.</p>
            {event.timestamp ? <time dateTime={event.timestamp} className="mt-1 block text-xs text-muted-foreground">{activityDate(event.timestamp)}</time> : <p className="mt-1 text-xs text-muted-foreground">Fecha no disponible · anterior al registro de actividad</p>}
          </div>
        </li>)}</ol> : <p className="py-4 text-sm text-muted-foreground">Todavía no hay actividad.</p>}
      </section>
    </>}
  </DialogContent>;
}