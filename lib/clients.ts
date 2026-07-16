// Server-only storage for clients.
// Uses Supabase when configured, falls back to filesystem in development.

import type { Client } from "./clientTypes";
import { loadClientsDb, saveClientsDb } from "./db";

export async function loadClients(): Promise<Client[]> {
  return loadClientsDb<Client>();
}

export async function saveClients(clients: Client[]): Promise<void> {
  await saveClientsDb(clients);
}
