import { getSupabaseClient } from './supabase';

interface LedgerEntry {
  id: string;
  date: string;
  revenue: number;
  coupons: number;
  debitNote: string;
  invoices: number;
  creditNote: string;
}

interface EntryRow {
  id: string;
  date: string;
  revenue: number | null;
  coupons: number | null;
  debit_note: string | null;
  invoices: number | null;
  credit_note: string | null;
}

interface SettingRow {
  key: string;
  value: string;
}

interface ArchivePayload {
  entries: Array<Record<string, unknown>>;
  totals: Record<string, unknown>;
  openingBalance: number;
  periodKey: string;
  displayLabel: string;
}

interface ArchiveRow {
  id: string;
  name: string;
  created_at: string;
  data: ArchivePayload;
}

const mapEntryRow = (row: EntryRow): LedgerEntry => ({
  id: row.id,
  date: row.date,
  revenue: row.revenue ?? 0,
  coupons: row.coupons ?? 0,
  debitNote: row.debit_note ?? '',
  invoices: row.invoices ?? 0,
  creditNote: row.credit_note ?? '',
});

const toEntryRow = (entry: LedgerEntry): EntryRow => ({
  id: entry.id,
  date: entry.date,
  revenue: entry.revenue,
  coupons: entry.coupons,
  debit_note: entry.debitNote,
  invoices: entry.invoices,
  credit_note: entry.creditNote,
});

export async function listEntries(): Promise<LedgerEntry[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('entries')
    .select('id, date, revenue, coupons, debit_note, invoices, credit_note')
    .order('date', { ascending: true });

  if (error) {
    throw error;
  }

  return ((data as EntryRow[] | null) ?? []).map(mapEntryRow);
}

export async function upsertEntries(entries: LedgerEntry[]) {
  if (entries.length === 0) {
    return;
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('entries')
    .upsert(entries.map(toEntryRow), { onConflict: 'id' });

  if (error) {
    throw error;
  }
}

export async function deleteAllEntries() {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('entries')
    .delete()
    .not('id', 'is', null);

  if (error) {
    throw error;
  }
}

export async function deleteEntryById(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('entries').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

export async function listSettings(): Promise<Record<string, string>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('settings').select('key, value');

  if (error) {
    throw error;
  }

  return ((data as SettingRow[] | null) ?? []).reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

export async function setSetting(key: string, value: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value }, { onConflict: 'key' });

  if (error) {
    throw error;
  }
}

export async function listArchives(): Promise<ArchiveRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('archives')
    .select('id, name, created_at, data')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data as ArchiveRow[] | null) ?? [];
}

export async function createArchive(archive: {
  id: string;
  name: string;
  data: ArchivePayload;
}) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('archives').insert(archive);

  if (error) {
    throw error;
  }
}
