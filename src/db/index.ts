import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { relations } from "./relations";

export const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({
  client: sql,
  relations,
});

export type DB = typeof db;
