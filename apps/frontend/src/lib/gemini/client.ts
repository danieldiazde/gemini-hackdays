import { GoogleGenAI } from "@google/genai";
import { requireEnv } from "@/lib/env";

let _client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: requireEnv("GEMINI_API_KEY") });
  }
  return _client;
}

export const FLASH_MODEL = "gemini-2.5-flash";
