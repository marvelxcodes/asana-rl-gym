import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const client = createClient({
  url: process.env.DATABASE_URL || "",
});

export const db = drizzle({ client });

// Export all schema tables
export * from "./schema/auth";
export * from "./schema/comment";
export * from "./schema/notification";
export * from "./schema/project";
export * from "./schema/task";
export * from "./schema/workspace";
