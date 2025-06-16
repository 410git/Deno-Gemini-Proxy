// config.ts
export const API_KEYS = Deno.env.get("API_KEYS")?.split(",").map(k => k.trim()) || [];
export const MASTER_KEY = Deno.env.get("MASTER_KEY");
export const RESET_KV = Deno.env.get("RESET_KV") === "1";
export const TARGET_API_BASE_URL = Deno.env.get("TARGET_API_BASE_URL") || "https://generativelanguage.googleapis.com";
