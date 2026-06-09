/**
 * DeepSeek client — optional LLM used ONLY for intent classification (and, later,
 * narrative polish). It never produces probabilities, news, injuries, or
 * suspensions — those always come from the deterministic engine / stored data.
 *
 * Reads config from the environment ONLY (never hard-coded, never logged):
 *   AI_PROVIDER=deepseek
 *   DEEPSEEK_API_KEY=<secret>          ← from .env.local / Vercel env
 *   DEEPSEEK_BASE_URL=https://api.deepseek.com
 *   DEEPSEEK_MODEL=deepseek-chat
 *
 * Every call is timed out and wrapped; any failure returns null so callers fall
 * back to the deterministic path.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function deepseekConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.length > 10);
}

/**
 * Send a chat completion to DeepSeek. Returns the assistant text, or null on
 * any error / missing key / timeout. Set `json` to request a strict JSON object.
 */
export async function deepseekChat(
  messages: ChatMessage[],
  opts: { json?: boolean; maxTokens?: number; timeoutMs?: number; temperature?: number } = {}
): Promise<string | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;

  const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 6000);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0,
        max_tokens: opts.maxTokens ?? 300,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content;
    return text?.trim() || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
