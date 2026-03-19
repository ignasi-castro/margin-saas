'use client';

import { ProcessedClient, AppConfig, ClientRow } from './types';
import { DEFAULT_CONFIG } from './defaults';
import { processClients } from './calculations';

const STORAGE_KEY_CLIENTS = 'mixpower_clients_raw';
const STORAGE_KEY_CONFIG = 'mixpower_config';
const STORAGE_KEY_COMPANY = 'mixpower_company';

export function saveConfig(config: AppConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
}

export function loadConfig(): AppConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) return JSON.parse(raw) as AppConfig;
  } catch {}
  return DEFAULT_CONFIG;
}

export function saveRawClients(rows: ClientRow[], company: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(rows));
  localStorage.setItem(STORAGE_KEY_COMPANY, company);
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
  return localStorage.getItem(STORAGE_KEY_COMPANY) ?? '';
}

export function loadProcessedClients(): ProcessedClient[] {
  const rows = loadRawClients();
  const config = loadConfig();
  if (rows.length === 0) return [];
  return processClients(rows, config);
}

export function clearData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_CLIENTS);
  localStorage.removeItem(STORAGE_KEY_COMPANY);
}
