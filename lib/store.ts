'use client';

import { ProcessedClient, AppConfig, ClientRow } from './types';
import { DEFAULT_CONFIG } from './defaults';
import { processClients } from './calculations';
import { createClient } from './supabase';

const STORAGE_KEY_CLIENTS = 'mixpower_clients_raw';
const STORAGE_KEY_CONFIG = 'mixpower_config';
const STORAGE_KEY_COMPANY = 'mixpower_company';
const STORAGE_KEY_LAST_UPLOAD = 'mixpower_last_upload';

export function saveConfig(config: AppConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch {}
}

export function loadConfig(): AppConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw) as AppConfig;
      // Validación mínima de estructura
      if (parsed && Array.isArray(parsed.families) && Array.isArray(parsed.segments)) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_CONFIG;
}

/*
  SQL para crear la tabla en Supabase:

  CREATE TABLE user_configs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    config jsonb not null,
    updated_at timestamp default now(),
    unique(user_id)
  );
  ALTER TABLE user_configs ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users manage own config" ON user_configs
    FOR ALL USING (auth.uid() = user_id);
*/

export async function saveConfigToSupabase(config: AppConfig): Promise<void> {
  try {
    const supabase = createClient();
    const result = await supabase.auth.getUser();
    const user = result?.data?.user;
    if (!user) return;
    await supabase
      .from('user_configs')
      .upsert(
        { user_id: user.id, config, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
  } catch {}
}

export async function loadConfigFromSupabase(): Promise<AppConfig | null> {
  try {
    const supabase = createClient();
    const result = await supabase.auth.getUser();
    const user = result?.data?.user;
    if (!user) return null;
    const { data, error } = await supabase
      .from('user_configs')
      .select('config')
      .eq('user_id', user.id)
      .single();
    if (error || !data) return null;
    const cfg = data.config as AppConfig;
    // Validación mínima antes de devolver
    if (cfg && Array.isArray(cfg.families) && Array.isArray(cfg.segments)) {
      return cfg;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveRawClients(rows: ClientRow[], company: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(rows));
    localStorage.setItem(STORAGE_KEY_COMPANY, company);
    localStorage.setItem(STORAGE_KEY_LAST_UPLOAD, new Date().toISOString());
  } catch {}
}

export function loadLastUploadDate(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(STORAGE_KEY_LAST_UPLOAD) ?? '';
  } catch {
    return '';
  }
}

export function loadRawClients(): ClientRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLIENTS);
    if (raw) return JSON.parse(raw) as ClientRow[];
  } catch {}
  return [];
}

export function loadCompany(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(STORAGE_KEY_COMPANY) ?? '';
  } catch {
    return '';
  }
}

export function loadProcessedClients(): ProcessedClient[] {
  try {
    const rows = loadRawClients();
    const config = loadConfig();
    if (rows.length === 0) return [];
    return processClients(rows, config);
  } catch {
    return [];
  }
}

export function clearData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_CLIENTS);
    localStorage.removeItem(STORAGE_KEY_COMPANY);
  } catch {}
}
