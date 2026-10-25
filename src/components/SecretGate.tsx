import { useState } from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SecretGate({
  onSubmit,
  label = "Desbloquear",
  busy,
  hint,
}: {
  onSubmit: (secret: string) => void;
  label?: string;
  busy?: boolean;
  hint?: string | undefined;
}) {
  const [v, setV] = useState("");
  const [show, setShow] = useState(false);
  return (
    <form
      className="rounded-2xl border bg-card p-4 shadow-soft"
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim().length >= 6) onSubmit(v.trim());
      }}
    >
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <KeyRound className="size-4" /> Tu palabra secreta
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={show ? "text" : "password"}
            value={v}
            onChange={(e) => setV(e.target.value)}
            placeholder="ej. turpial-cacao-tepuy-421"
            className="h-11 pr-10 font-mono"
            autoComplete="off"
          />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3 text-muted-foreground" aria-label="Mostrar">
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <Button type="submit" className="h-11" disabled={busy || v.trim().length < 6}>
          {busy ? "…" : label}
        </Button>
      </div>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </form>
  );
}
