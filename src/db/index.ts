import { neon, Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { relations } from "./relations";

// Node 22+ supplies WebSocket. Interactive transactions are required by payroll and leave.
neonConfig.webSocketConstructor = WebSocket;
export const sql = neon(process.env.DATABASE_URL!);
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
export const db = drizzle({ client: pool, relations });
export type DB = typeof db;
export type Transaction = Parameters<Parameters<DB["transaction"]>[0]>[0];
export type Database = DB | Transaction;

