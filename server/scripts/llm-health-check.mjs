import "dotenv/config";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";

const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || "openai/gpt-oss-120b:free";

async function checkModel(label, modelFactory) {
  try {
    const result = await streamText({
      model: modelFactory(),
      messages: [
        {
          role: "user",
          content: "Reply with a short, plain-text hello.",
        },
      ],
    });

    const text = (await result.text).trim();
    if (!text) {
      console.error(`[FAIL] ${label}: empty response`);
      return false;
    }

    console.log(`[OK] ${label}: ${text.substring(0, 80)}`);
    return true;
  } catch (error) {
    console.error(`[FAIL] ${label}:`, error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function run() {
  let ok = true;

  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    ok = (await checkModel(`Gemini (${PRIMARY_MODEL})`, () => google(PRIMARY_MODEL))) && ok;
  } else {
    console.warn("[SKIP] Gemini: GOOGLE_GENERATIVE_AI_API_KEY is not set");
    ok = false;
  }

  if (process.env.OPENAI_API_KEY) {
    ok = (await checkModel(`OpenAI fallback (${FALLBACK_MODEL})`, () => openai(FALLBACK_MODEL))) && ok;
  } else {
    console.warn("[SKIP] OpenAI fallback: OPENAI_API_KEY is not set");
    ok = false;
  }

  process.exit(ok ? 0 : 1);
}

run();
