// Server-only storage for clients (uses the filesystem).
// Types and the mandate evaluation engine live in clientTypes.ts so client
// components can import them without pulling in "fs".

import { promises as fs } from "fs";
import path from "path";
import type { Client } from "./clientTypes";

const DATA_DIR = path.join(process.cwd(), "data");
const CLIENTS_FILE = path.join(DATA_DIR, "clients.json");

export async function loadClients(): Promise<Client[]> {
  try {
    const raw = await fs.readFile(CLIENTS_FILE, "utf8");
    const parsed = JSON.parse(raw) as Client[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveClients(clients: Client[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CLIENTS_FILE, JSON.stringify(clients, null, 2), "utf8");
}
