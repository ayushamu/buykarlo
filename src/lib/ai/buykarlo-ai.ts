const GEMINI_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"]
const DEFAULT_COOLDOWN_SECONDS = process.env.NODE_ENV === "development" ? 2 : 8
const DEFAULT_DAILY_LIMIT = process.env.NODE_ENV === "development" ? 500 : 50

export type AiUsageFeature =
  | "seller_bot_turn"
  | "seller_bot_generate_listing"

type GeminiResult =
  | { success: true; text: string; model: string }
  | { success: false; error: string; status: number }

type UsageResult =
  | { allowed: true }
  | { allowed: false; error: string; status: number }

function getPositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function asText(value: unknown, maxLength = 300) {
  if (typeof value !== "string" && typeof value !== "number") return ""
  return String(value).trim().slice(0, maxLength)
}

function geminiEndpoint(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
}

export function parseJsonObject(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()

  try {
    return JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    const jsonStart = cleaned.indexOf("{")
    const jsonEnd = cleaned.lastIndexOf("}")

    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      return JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1)) as Record<string, unknown>
    }

    throw new Error("No JSON object found in model response.")
  }
}

export async function checkAiUsageLimit(supabase: any, userId: string): Promise<UsageResult> {
  const cooldownSeconds = getPositiveNumber(process.env.BUYKARLO_AI_COOLDOWN_SECONDS, DEFAULT_COOLDOWN_SECONDS)
  const dailyLimit = getPositiveNumber(process.env.BUYKARLO_AI_DAILY_LIMIT, DEFAULT_DAILY_LIMIT)
  const cooldownSince = new Date(Date.now() - cooldownSeconds * 1000).toISOString()
  const daySince = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: recent, error: recentError } = await supabase
    .from("ai_usage_events")
    .select("id")
    .eq("user_id", userId)
    .gte("created_at", cooldownSince)
    .limit(1)

  if (recentError) {
    console.error("AI cooldown check failed:", recentError)
    return { allowed: false, error: "BuyKarlo AI usage tracking is not ready yet. Please try again later.", status: 503 }
  }

  if (recent && recent.length > 0) {
    return { allowed: false, error: "Wait a few seconds before using BuyKarlo AI again.", status: 429 }
  }

  const { count, error: countError } = await supabase
    .from("ai_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", daySince)

  if (countError) {
    console.error("AI daily limit check failed:", countError)
    return { allowed: false, error: "BuyKarlo AI usage tracking is not ready yet. Please try again later.", status: 503 }
  }

  if ((count || 0) >= dailyLimit) {
    return { allowed: false, error: "You've used today's BuyKarlo AI actions. Try again tomorrow.", status: 429 }
  }

  return { allowed: true }
}

export async function logAiUsageEvent(supabase: any, userId: string, feature: AiUsageFeature) {
  const { error } = await supabase
    .from("ai_usage_events")
    .insert({
      user_id: userId,
      feature,
    })

  if (error) {
    console.error("AI usage event insert failed:", error)
    return false
  }

  return true
}

export async function generateGeminiText(apiKey: string, prompt: string, maxOutputTokens: number): Promise<GeminiResult> {
  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.25,
      maxOutputTokens,
      responseMimeType: "text/plain",
    },
  }

  for (const model of GEMINI_MODELS) {
    const response = await fetch(geminiEndpoint(model), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
    })

    if (response.ok) {
      const data = await response.json()
      if (data?.promptFeedback?.blockReason) {
        return { success: false, error: "BuyKarlo AI could not process this because it was blocked by safety filters.", status: 400 }
      }

      const candidate = data?.candidates?.[0]
      if (!candidate || candidate.finishReason === "SAFETY") {
        return { success: false, error: "BuyKarlo AI could not safely process this. Please edit your message and try again.", status: 400 }
      }

      if (candidate.finishReason === "MAX_TOKENS") {
        console.error("Gemini response was truncated:", model, candidate.finishReason)
        continue
      }

      const text = candidate.content?.parts
        ?.map((part: { text?: string }) => part.text || "")
        .join("")
        .trim()

      if (!text) {
        return { success: false, error: "BuyKarlo AI returned an empty response. Please try again.", status: 502 }
      }

      return { success: true, text, model }
    }

    const errorText = await response.text()
    console.error("Gemini request failed:", model, response.status, errorText)

    if (![429, 503].includes(response.status)) {
      return { success: false, error: "BuyKarlo AI could not respond right now. Please try again.", status: 502 }
    }
  }

  return { success: false, error: "BuyKarlo AI is busy right now. Please try again in a moment.", status: 503 }
}

export async function createGeminiStream(apiKey: string, prompt: string, maxOutputTokens: number): Promise<ReadableStream> {
  const model = GEMINI_MODELS[0]
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`
  
  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.25,
      maxOutputTokens,
      responseMimeType: "text/plain",
    },
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini stream call failed: ${response.status} - ${errText}`)
  }

  const reader = response.body?.getReader()
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let buffer = ""

  return new ReadableStream({
    async start(controller) {
      if (!reader) {
        controller.close()
        return
      }

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith("data:")) continue

            const jsonStr = trimmed.slice(5).trim()
            if (!jsonStr) continue

            try {
              const data = JSON.parse(jsonStr)
              const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
              if (text) {
                controller.enqueue(encoder.encode(text))
              }
            } catch (err) {
              // Ignore partial parse failures
            }
          }
        }

        if (buffer.trim().startsWith("data:")) {
          const jsonStr = buffer.trim().slice(5).trim()
          try {
            const data = JSON.parse(jsonStr)
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
            if (text) {
              controller.enqueue(encoder.encode(text))
            }
          } catch (e) {}
        }
      } catch (err: any) {
        controller.error(err)
      } finally {
        controller.close()
      }
    }
  })
}
