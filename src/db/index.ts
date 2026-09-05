import { neon, Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { relations } from "./relations";

// Node 22+ supplies WebSocket. Interactive transactions are required by payroll and leave.
if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket;
}

const connectionString = process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder";
export const sql = neon(connectionString);
const pool = new Pool({ connectionString, max: 10 });
export const db = drizzle({ client: pool, relations });
export type DB = typeof db;
export type Transaction = Parameters<Parameters<DB["transaction"]>[0]>[0];
export type Database = DB | Transaction;

