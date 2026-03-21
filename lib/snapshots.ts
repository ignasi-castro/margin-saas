'use client';

import { createClient } from './supabase';
import { ProcessedClient } from './types';

export interface SnapshotMeta {
  id: string;
  fecha: string;
  nombre: string;
  count: number;
}

export async function saveSnapshot(
  nombre: string,
  clientes: ProcessedClient[]
): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay usuario autenticado');

  const fecha = new Date().toISOString().split('T')[0];

  const { data: snapshot, error: snapError } = await supabase
    .from('snapshots')
    .insert({ user_id: user.id, fecha, nombre })
    .select('id')
    .single();

  if (snapError || !snapshot) throw snapError ?? new Error('Error al crear snapshot');

  const rows = clientes.map(c => ({ snapshot_id: snapshot.id, datos: c }));
  const { error: clientesError } = await supabase.from('snapshot_clientes').insert(rows);
  if (clientesError) throw clientesError;

  return snapshot.id as string;
}

export async function loadSnapshots(): Promise<SnapshotMeta[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: snaps, error } = await supabase
    .from('snapshots')
    .select('id, fecha, nombre')
    .eq('user_id', user.id)
    .order('fecha', { ascending: false });

  if (error || !snaps?.length) return [];

  // Contar clientes de todos los snapshots en una sola query
  const { data: clientRows } = await supabase
    .from('snapshot_clientes')
    .select('snapshot_id')
    .in('snapshot_id', snaps.map(s => s.id));

  const countMap: Record<string, number> = {};
  for (const r of clientRows ?? []) {
    countMap[r.snapshot_id] = (countMap[r.snapshot_id] ?? 0) + 1;
  }

  return snaps.map(s => ({
    id: s.id as string,
    fecha: s.fecha as string,
    nombre: s.nombre as string,
    count: countMap[s.id] ?? 0,
  }));
}

export async function loadSnapshotClientes(snapshotId: string): Promise<ProcessedClient[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('snapshot_clientes')
    .select('datos')
    .eq('snapshot_id', snapshotId);

  if (error) throw error;
  return (data ?? []).map(r => r.datos as ProcessedClient);
}

export async function deleteSnapshot(id: string): Promise<void> {
  const supabase = createClient();
  // Primero borramos los clientes (por si no hay CASCADE en la BD)
  await supabase.from('snapshot_clientes').delete().eq('snapshot_id', id);
  const { error } = await supabase.from('snapshots').delete().eq('id', id);
  if (error) throw error;
}
