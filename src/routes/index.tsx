import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Download, Sparkles, Shuffle, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { submitProposal } from "@/lib/civic.functions";
import { useIdentity, generatePhrase } from "@/lib/identity";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Propón tu idea — Voz Anónima" },
      { name: "description", content: "Escribe tu propuesta y súmala a la voz ciudadana de forma 100% anónima." },
      { property: "og:title", content: "Propón tu idea — Voz Anónima" },
      { property: "og:description", content: "Propuestas ciudadanas anónimas agregadas con IA." },
    ],
  }),
  component: Home,
});

const ACTIONS = [
  { tipo: "Quiero", emoji: "🟢", cls: "bg-want text-want-foreground" },
  { tipo: "Me gusta", emoji: "🔵", cls: "bg-like text-like-foreground" },
  { tipo: "No me gusta", emoji: "🔴", cls: "bg-dislike text-dislike-foreground" },
] as const;

function Home() {
  const id = useIdentity();
  const submit = useServerFn(submitProposal);
  const [text, setText] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [ticket, setTicket] = useState<{ n: number; secret: string; categoria: string } | null>(null);
  const activeSecret = id.secret ?? secret;

  async function send(tipo: (typeof ACTIONS)[number]["tipo"]) {
    if (text.trim().length < 5) { toast.error("Escribe tu propuesta (mín. 5 caracteres)"); return; }
    const s = activeSecret.trim() || generatePhrase();
    if (s.length < 6) { toast.error("La palabra secreta necesita al menos 6 caracteres"); return; }
    setBusy(tipo);
    try {
      const r = await submit({ data: { contenido: text, tipo, secret: s } });
      id.set(s, r.userNumber);
      setTicket({ n: r.userNumber, secret: s, categoria: r.categoria });
      setText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al enviar");
    } finally {
      setBusy(null);
    }
  }

  function download() {
    if (!ticket) return;
    const body = `VOZ ANÓNIMA — TICKET DIGITAL\n============================\nIdentidad pública: User #${ticket.n}\nPalabra secreta:   ${ticket.secret}\nEmitido:           ${new Date().toLocaleString("es-VE")}\n\nGuarda este archivo en un lugar seguro.\nNo podemos recuperar tu palabra secreta:\nsolo almacenamos su huella SHA-256.\n`;
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket-user-${ticket.n}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <section className="pt-4 text-center md:pt-10">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="size-3.5 text-want" /> Sin correo · sin nombre · sin IP
        </span>
        <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] md:text-6xl">
          ¿Qué necesita <span className="relative inline-block"><span className="relative z-10">tu comunidad</span><span className="absolute inset-x-0 bottom-1 -z-0 h-3 rounded bg-sun/70" /></span>?
        </h1>
        <p className="mt-3 text-muted-foreground">Escribe tu idea. La IA la clasifica y la suma a la voz de todo el país.</p>
      </section>

      <div className="mt-8 rounded-3xl border bg-card p-3 shadow-lift">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          placeholder="Ej: Quiero que el agua llegue todos los días a mi parroquia…"
          className="min-h-36 resize-none border-0 bg-transparent text-lg shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between px-2 pb-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Sparkles className="size-3.5" /> Clasificación con IA</span>
          <span>{text.length}/1000</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 md:gap-3">
        {ACTIONS.map((a) => (
          <button
            key={a.tipo}
            onClick={() => send(a.tipo)}
            disabled={!!busy}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-4 font-display text-base font-bold shadow-soft transition active:scale-95 disabled:opacity-60 md:text-lg",
              a.cls,
            )}
          >
            <span className="text-2xl">{a.emoji}</span>
            {busy === a.tipo ? "Enviando…" : a.tipo}
          </button>
        ))}
      </div>

      {!id.secret ? (
        <div className="mt-6 rounded-2xl border border-dashed p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold"><Lock className="size-4" /> Crea tu palabra secreta (opcional)</label>
          <div className="flex gap-2">
            <Input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Déjala vacía y generamos una" className="h-11 font-mono" autoComplete="off" />
            <Button variant="outline" className="h-11" onClick={() => setSecret(generatePhrase())} aria-label="Generar"><Shuffle className="size-4" /></Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Es tu única llave. Se convierte en una huella SHA-256 antes de guardarse. ¿Ya tienes una? <Link to="/perfil" className="font-semibold text-primary underline">Cárgala</Link>.
          </p>
        </div>
      ) : (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Publicando como <span className="font-mono font-semibold text-foreground">User #{id.userNumber ?? "…"}</span> ·{" "}
          <button className="underline" onClick={() => id.set(null)}>usar otra identidad</button>
        </p>
      )}

      <Dialog open={!!ticket} onOpenChange={(o) => !o && setTicket(null)}>
        <DialogContent className="max-w-sm p-0">
          <div className="rounded-t-lg bg-ink p-6 text-primary-foreground">
            <DialogHeader>
              <DialogTitle className="text-primary-foreground">¡Propuesta recibida!</DialogTitle>
              <DialogDescription className="text-primary-foreground/75">Clasificada como {ticket?.categoria}. Guarda tu ticket.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="ticket-edge h-4 bg-card" />
          <div className="space-y-4 px-6 pb-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Identidad pública</p>
              <p className="font-mono text-3xl font-semibold">User #{ticket?.n}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Palabra secreta</p>
              <p className="break-all rounded-lg bg-muted p-3 font-mono text-sm">{ticket?.secret}</p>
            </div>
            <p className="text-xs text-destructive">No podemos recuperarla. Si la pierdes, pierdes esta identidad.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(ticket?.secret ?? ""); toast.success("Copiada"); }}>
                <Copy className="size-4" /> Copiar
              </Button>
              <Button onClick={download}><Download className="size-4" /> Ticket .txt</Button>
            </div>
            <Link to="/perfil" className="block text-center text-sm font-semibold text-primary underline">Completar perfil demográfico →</Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
