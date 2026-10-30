import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const MODEL = "openai/gpt-6-astra";

/** Self-hosted Ollama (OpenAI-compatible /v1), optionally behind Cloudflare Access. */
async function ollamaText(system: string, prompt: string): Promise<string> {
  const base = (process.env["OLLAMA_BASE_URL"] ?? "").replace(/\/+$/, "");
  const model = process.env["OLLAMA_MODEL"] || "llama3.2:3b";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const cfId = process.env["CF_ACCESS_CLIENT_ID"];
  const cfSecret = process.env["CF_ACCESS_CLIENT_SECRET"];
  if (cfId && cfSecret) {
    headers["CF-Access-Client-Id"] = cfId;
    headers["CF-Access-Client-Secret"] = cfSecret;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), Number(process.env["OLLAMA_TIMEOUT_MS"] || 45000));
  try {
    const res = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers,
      signal: ctrl.signal,
      body: JSON.stringify({
        model,
        stream: false,
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Ollama respondió ${res.status}`);
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return json.choices?.[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timer);
  }
}

/** Returns the final AI text (server-only). Uses Ollama when OLLAMA_BASE_URL is set. */
export async function aiText(system: string, prompt: string): Promise<string> {
  if (process.env["OLLAMA_BASE_URL"]) return ollamaText(system, prompt);
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI no configurada");
  let runId: string | undefined;
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
      return res;
    },
  });
  const result = streamText({
    model: provider.responses(MODEL) as unknown as Parameters<typeof streamText>[0]["model"],
    system,
    prompt,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  return await result.text;
}

export function extractJson<T>(text: string): T | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as T;
  } catch {
    return null;
  }
}
