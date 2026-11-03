import { Link } from "@tanstack/react-router";
import { Lightbulb, UserRound, Rows3, Map, Landmark, ShieldCheck, Heart } from "lucide-react";
import type { ReactNode } from "react";
import { useIdentity } from "@/lib/identity";

const NAV = [
  { to: "/", label: "Idear", icon: Lightbulb },
  { to: "/explorar", label: "Explorar", icon: Rows3 },
  { to: "/mapa", label: "Mapa IA", icon: Map },
  { to: "/votaciones", label: "Votar", icon: Landmark },
  { to: "/perfil", label: "Perfil", icon: UserRound },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { userNumber } = useIdentity();
  return (
    <div className="min-h-screen pb-24 md:pb-10">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink text-primary-foreground">
              <ShieldCheck className="size-4" />
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="font-display text-lg font-bold">VENZX</span>
              <span className="hidden truncate text-[11px] font-medium text-muted-foreground sm:block">
                Ideas anónimas, soluciones reales y participación ciudadana
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a
              href="https://paypal.me/drichm"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-full bg-want px-3 py-1.5 text-sm font-semibold text-want-foreground shadow-soft transition hover:opacity-90 sm:inline-flex"
            >
              <Heart className="size-3.5" /> Donar
            </a>
            <span className="rounded-full border bg-card px-3 py-1 font-mono text-xs">
              {userNumber ? `User #${userNumber}` : "Anónimo"}
            </span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-6 text-center text-xs text-muted-foreground">
        <a
          href="https://paypal.me/drichm"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-primary underline underline-offset-2"
        >
          <Heart className="size-3.5" /> Apoya el proyecto con una donación
        </a>
      </footer>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground data-[status=active]:text-primary"
            >
              <n.icon className="size-5" />
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
