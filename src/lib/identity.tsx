import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Secret word lives only in this tab's sessionStorage — cleared when the tab closes.
type Identity = { secret: string | null; userNumber: number | null; set: (s: string | null, n?: number | null) => void };
const Ctx = createContext<Identity>({ secret: null, userNumber: null, set: () => {} });
const KEY = "civica.secret";

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [secret, setSecret] = useState<string | null>(null);
  const [userNumber, setNum] = useState<number | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        const v = JSON.parse(raw) as { s: string; n: number | null };
        setSecret(v.s);
        setNum(v.n);
      }
    } catch {}
  }, []);
  const set = (s: string | null, n: number | null = null) => {
    setSecret(s);
    setNum(n);
    if (s) sessionStorage.setItem(KEY, JSON.stringify({ s, n }));
    else sessionStorage.removeItem(KEY);
  };
  return <Ctx.Provider value={{ secret, userNumber, set }}>{children}</Ctx.Provider>;
}
export const useIdentity = () => useContext(Ctx);

const WORDS = ["araguaney", "cacao", "turpial", "tepuy", "chigüire", "orinoco", "samán", "morrocoy", "cardenal", "guacamaya", "médano", "colibrí", "catatumbo", "arepa", "cocuy", "mango", "lucero", "páramo"];
export function generatePhrase() {
  const r = new Uint32Array(4);
  crypto.getRandomValues(r);
  return `${WORDS[r[0] % WORDS.length]}-${WORDS[r[1] % WORDS.length]}-${WORDS[r[2] % WORDS.length]}-${(r[3] % 900) + 100}`;
}
