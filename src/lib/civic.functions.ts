import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Privacy: the secret word never leaves the handler. Only its SHA-256 digest is stored.
async function sha256(secret: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret.trim()));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}
async function findUser(secret: string) {
  const s = await db();
  const { data } = await s.from("usuarios").select("*").eq("secreto_hash", await sha256(secret)).maybeSingle();
  return data;
}
const secretSchema = z.string().trim().min(6, "Mínimo 6 caracteres").max(120);
const CATS = ["Economía", "Salud", "Servicios", "Educación", "Tecnología", "Seguridad", "Ambiente", "General"];

// ---------- Screen 1 ----------
export const submitProposal = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({
      contenido: z.string().trim().min(5).max(1000),
      tipo: z.enum(["Quiero", "Me gusta", "No me gusta"]),
      secret: secretSchema,
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const s = await db();
    const hash = await sha256(data.secret);
    let { data: user } = await s.from("usuarios").select("id_correlativo").eq("secreto_hash", hash).maybeSingle();
    let isNew = false;
    if (!user) {
      const ins = await s.from("usuarios").insert({ secreto_hash: hash }).select("id_correlativo").single();
      if (ins.error) throw new Error("No se pudo crear la identidad");
      user = ins.data;
      isNew = true;
    }
    let categoria = "General";
    try {
      const { aiText } = await import("./ai.server");
      const out = await aiText(
        `Clasifica propuestas ciudadanas venezolanas. Responde SOLO con una palabra de esta lista: ${CATS.join(", ")}.`,
        data.contenido,
      );
      categoria = CATS.find((c) => out.toLowerCase().includes(c.toLowerCase())) ?? "General";
    } catch (e) {
      console.error("AI classify failed", e instanceof Error ? e.message : e);
    }
    const p = await s
      .from("propuestas")
      .insert({ id_usuario: user.id_correlativo, tipo_intencion: data.tipo, contenido: data.contenido, categoria })
      .select("id_propuesta")
      .single();
    if (p.error) throw new Error("No se pudo guardar la propuesta");
    return { userNumber: user.id_correlativo, categoria, isNew };
  });

// ---------- Screen 2 ----------
export const loadProfile = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ secret: secretSchema, create: z.boolean().optional() }).parse(d))
  .handler(async ({ data }) => {
    let u = await findUser(data.secret);
    if (!u && data.create) {
      const s = await db();
      const ins = await s.from("usuarios").insert({ secreto_hash: await sha256(data.secret) }).select("*").single();
      u = ins.data;
    }
    if (!u) return null;
    const { secreto_hash: _h, ...pub } = u;
    return pub;
  });

export const saveProfile = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({
      secret: secretSchema,
      genero: z.string().nullable(),
      edad_rango: z.string().nullable(),
      estado: z.string().nullable(),
      municipio: z.string().nullable(),
      parroquia: z.string().nullable(),
      intereses: z.array(z.string()).max(10),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { secret, ...rest } = data;
    const s = await db();
    const { error } = await s.from("usuarios").update(rest).eq("secreto_hash", await sha256(secret));
    if (error) throw new Error("No se pudo guardar");
    return { ok: true };
  });

// ---------- Screen 3 ----------
const filterSchema = z.object({
  genero: z.string().optional(),
  edad: z.string().optional(),
  estado: z.string().optional(),
  municipio: z.string().optional(),
  categoria: z.string().optional(),
});
export type FeedFilters = z.infer<typeof filterSchema>;

export const listProposals = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ offset: z.number().int().min(0), filters: filterSchema }).parse(d))
  .handler(async ({ data }) => {
    const s = await db();
    const f = data.filters;
    let q = s
      .from("propuestas")
      .select("id_propuesta, id_usuario, tipo_intencion, contenido, categoria, fecha_creacion, usuarios!inner(genero, edad_rango, estado, municipio)")
      .order("fecha_creacion", { ascending: false })
      .range(data.offset, data.offset + 9);
    if (f.genero) q = q.eq("usuarios.genero", f.genero);
    if (f.edad) q = q.eq("usuarios.edad_rango", f.edad);
    if (f.estado) q = q.eq("usuarios.estado", f.estado);
    if (f.municipio) q = q.eq("usuarios.municipio", f.municipio);
    if (f.categoria) q = q.eq("categoria", f.categoria);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const ids = (rows ?? []).map((r) => r.id_propuesta);
    const { data: ap } = ids.length
      ? await s.from("apoyos_propuestas").select("id_propuesta, voto_tipo").in("id_propuesta", ids)
      : { data: [] };
    return (rows ?? []).map((r) => {
      const u = r.usuarios as unknown as { estado: string | null; municipio: string | null };
      return {
        id: r.id_propuesta,
        user: r.id_usuario,
        tipo: r.tipo_intencion,
        contenido: r.contenido,
        categoria: r.categoria,
        fecha: r.fecha_creacion,
        lugar: [u?.municipio, u?.estado].filter(Boolean).join(", "),
        apoyos: (ap ?? []).filter((a) => a.id_propuesta === r.id_propuesta && a.voto_tipo === "Apoyar").length,
        discrepa: (ap ?? []).filter((a) => a.id_propuesta === r.id_propuesta && a.voto_tipo === "Discrepar").length,
      };
    });
  });

export const reactProposal = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ secret: secretSchema, id: z.number().int(), tipo: z.enum(["Apoyar", "Discrepar"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const u = await findUser(data.secret);
    if (!u) throw new Error("Palabra secreta no encontrada");
    const s = await db();
    const { error } = await s
      .from("apoyos_propuestas")
      .upsert({ id_usuario: u.id_correlativo, id_propuesta: data.id, voto_tipo: data.tipo }, { onConflict: "id_usuario,id_propuesta" });
    if (error) throw new Error("No se pudo registrar");
    return { ok: true };
  });

// ---------- Screen 4 ----------
type Insight = { prioridades: { tema: string; puntaje: number }[]; palabras: { texto: string; peso: number }[]; resumen: string };

export const getInsights = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ estado: z.string().optional(), query: z.string().max(300).optional() }).parse(d))
  .handler(async ({ data }) => {
    const s = await db();
    const { data: all } = await s
      .from("propuestas")
      .select("id_propuesta, id_usuario, contenido, categoria, fecha_creacion, usuarios!inner(estado, municipio, edad_rango, genero)")
      .order("fecha_creacion", { ascending: false })
      .limit(500);
    const rows = (all ?? []).map((r) => ({ ...r, u: r.usuarios as unknown as { estado: string | null; municipio: string | null; edad_rango: string | null; genero: string | null } }));
    const byState: Record<string, number> = {};
    rows.forEach((r) => { if (r.u.estado) byState[r.u.estado] = (byState[r.u.estado] ?? 0) + 1; });
    const scoped = data.estado ? rows.filter((r) => r.u.estado === data.estado) : rows;

    const ids = scoped.map((r) => r.id_propuesta);
    const { data: ap } = ids.length
      ? await s.from("apoyos_propuestas").select("id_propuesta").eq("voto_tipo", "Apoyar").in("id_propuesta", ids)
      : { data: [] };
    const support: Record<number, number> = {};
    (ap ?? []).forEach((a) => (support[a.id_propuesta] = (support[a.id_propuesta] ?? 0) + 1));
    const weekAgo = Date.now() - 7 * 864e5;
    const pool = scoped.filter((r) => new Date(r.fecha_creacion).getTime() > weekAgo);
    const top = [...(pool.length ? pool : scoped)].sort((a, b) => (support[b.id_propuesta] ?? 0) - (support[a.id_propuesta] ?? 0))[0];

    // Fallback stats
    const catCount: Record<string, number> = {};
    scoped.forEach((r) => (catCount[r.categoria] = (catCount[r.categoria] ?? 0) + 1 + (support[r.id_propuesta] ?? 0)));
    let insight: Insight = {
      prioridades: Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tema, puntaje]) => ({ tema, puntaje })),
      palabras: [],
      resumen: "",
    };
    const stop = new Set("de la el en los las que y a para un una con del por se no mi es al lo más muy".split(" "));
    const freq: Record<string, number> = {};
    scoped.forEach((r) => r.contenido.toLowerCase().replace(/[^\p{L}\s]/gu, "").split(/\s+/).forEach((w) => {
      if (w.length > 4 && !stop.has(w)) freq[w] = (freq[w] ?? 0) + 1;
    }));
    insight.palabras = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([texto, peso]) => ({ texto, peso }));

    let ai = false;
    if (scoped.length) {
      try {
        const { aiText, extractJson } = await import("./ai.server");
        const lines = scoped.slice(0, 120).map((r) =>
          `- [${r.categoria}] (${r.u.genero ?? "?"}, ${r.u.edad_rango ?? "?"}, ${r.u.municipio ?? "?"}/${r.u.estado ?? "?"}, apoyos:${support[r.id_propuesta] ?? 0}) ${r.contenido}`,
        ).join("\n");
        const out = await aiText(
          `Eres un analista cívico. Analiza propuestas ciudadanas anónimas de Venezuela y responde SOLO JSON válido con la forma {"prioridades":[{"tema":string,"puntaje":number 0-100}] (exactamente 3, ordenadas por urgencia),"palabras":[{"texto":string,"peso":number 1-10}] (10-14 temas o palabras clave),"resumen":string (máx 2 frases en español)}. Si la pregunta del usuario menciona un grupo o lugar, céntrate en él.`,
          `Pregunta: ${data.query || "¿Cuáles son las prioridades más urgentes?"}\nRegión: ${data.estado ?? "Toda Venezuela"}\nPropuestas:\n${lines}`,
        );
        const parsed = extractJson<Insight>(out);
        if (parsed?.prioridades?.length) { insight = { ...insight, ...parsed }; ai = true; }
      } catch (e) {
        console.error("AI insights failed", e instanceof Error ? e.message : e);
      }
    }
    return {
      byState,
      total: scoped.length,
      insight,
      ai,
      top: top ? { id: top.id_propuesta, user: top.id_usuario, contenido: top.contenido, categoria: top.categoria, apoyos: support[top.id_propuesta] ?? 0, lugar: [top.u.municipio, top.u.estado].filter(Boolean).join(", ") } : null,
    };
  });

// ---------- Screen 5 ----------
export const listPolls = createServerFn({ method: "GET" }).handler(async () => {
  const s = await db();
  const { data: polls } = await s.from("votaciones_convocadas").select("*").order("fecha_inicio", { ascending: false });
  const { data: votes } = await s.from("votos_finales").select("id_votacion, opcion_seleccionada");
  const now = Date.now();
  return (polls ?? []).map((p) => {
    const v = (votes ?? []).filter((x) => x.id_votacion === p.id_votacion);
    const count = (o: string) => v.filter((x) => x.opcion_seleccionada === o).length;
    return { ...p, abierta: p.activa && new Date(p.fecha_fin).getTime() > now, resultados: { SI: count("SI"), NO: count("NO"), ABSTENCION: count("ABSTENCION") }, total: v.length };
  });
});

export const unlockVoting = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ secret: secretSchema }).parse(d))
  .handler(async ({ data }) => {
    const u = await findUser(data.secret);
    if (!u) return null;
    const s = await db();
    const { data: mine } = await s.from("votos_finales").select("id_votacion, opcion_seleccionada").eq("id_usuario", u.id_correlativo);
    return { user: u.id_correlativo, estado: u.estado, municipio: u.municipio, votos: mine ?? [] };
  });

export const castVote = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ secret: secretSchema, id: z.number().int(), opcion: z.enum(["SI", "NO", "ABSTENCION"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const u = await findUser(data.secret);
    if (!u) throw new Error("Palabra secreta no encontrada");
    const s = await db();
    const { data: p } = await s.from("votaciones_convocadas").select("*").eq("id_votacion", data.id).single();
    if (!p || !p.activa || new Date(p.fecha_fin).getTime() < Date.now()) throw new Error("Votación cerrada");
    if (p.estado_restriccion && p.estado_restriccion !== u.estado) throw new Error("Tu perfil no está en el estado de esta votación");
    if (p.municipio_restriccion && p.municipio_restriccion !== u.municipio) throw new Error("Tu perfil no está en el municipio de esta votación");
    const { error } = await s.from("votos_finales").insert({ id_votacion: data.id, id_usuario: u.id_correlativo, opcion_seleccionada: data.opcion });
    if (error) throw new Error(error.code === "23505" ? "Ya votaste en esta consulta" : "No se pudo votar");
    return { ok: true };
  });

export const exportPollCsv = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    const s = await db();
    const { data: p } = await s.from("votaciones_convocadas").select("*").eq("id_votacion", data.id).single();
    if (!p || (p.activa && new Date(p.fecha_fin).getTime() > Date.now())) throw new Error("Solo para votaciones concluidas");
    const { data: v } = await s.from("votos_finales").select("id_voto, id_usuario, opcion_seleccionada").eq("id_votacion", data.id).order("id_voto");
    const lines = ["voto,usuario,opcion", ...(v ?? []).map((x) => `${x.id_voto},User #${x.id_usuario},${x.opcion_seleccionada}`)];
    return { titulo: p.titulo, csv: lines.join("\n") };
  });
