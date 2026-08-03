import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const CONFIG_KEY = "trainiq-supabase-config";
const DEFAULT_CONFIG = {
  url: "https://izbhhunefxtygkswwsjl.supabase.co",
  anonKey: "sb_publishable_cGWG00suCMcvDO_pdMxuZg_1KG65wYP",
};

let cachedClient = null;
let cachedSignature = "";

export function getSupabaseConfig() {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveSupabaseConfig(config) {
  const cleanConfig = {
    url: String(config.url || "").trim(),
    anonKey: String(config.anonKey || "").trim(),
  };

  localStorage.setItem(CONFIG_KEY, JSON.stringify(cleanConfig));
  cachedClient = null;
  cachedSignature = "";
  return cleanConfig;
}

export function hasSupabaseConfig() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey);
}

export function getSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  const signature = `${config.url}:${config.anonKey}`;
  if (!cachedClient || cachedSignature !== signature) {
    cachedClient = createClient(config.url, config.anonKey);
    cachedSignature = signature;
  }

  return cachedClient;
}
