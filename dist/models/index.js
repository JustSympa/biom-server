import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").default(""),
    email: text("email").default(""),
    refreshToken: text("refresh_token").default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export const reports = pgTable("reports", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    responseId: text("response_id").notNull(),
    report: jsonb("report").notNull(), // the full structured report from OpenAI
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
//# sourceMappingURL=index.js.map