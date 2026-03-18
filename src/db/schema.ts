import { integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core"

// ─── Tabelas existentes ────────────────────────────────────────────────────

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
  name: text("name").notNull(),
  customerKey: text("customer_key").notNull().unique(),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  linearWebhookSecret: text("linear_webhook_secret"),
})

export const usageDaily = sqliteTable(
  "usage_daily",
  {
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    events: integer("events").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.customerId, t.date] })],
)

export const tokenUsage = sqliteTable("token_usage", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  developer: text("developer").notNull(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  model: text("model").notNull(),
  date: text("date").notNull(),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
  cacheCreationTokens: integer("cache_creation_tokens").notNull().default(0),
  createdAt: text("created_at").notNull(),
  durationSeconds: integer("duration_seconds"),
  projectName: text("project_name"),
  repository: text("repository"),
})

export const modelPricing = sqliteTable("model_pricing", {
  id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
  modelPattern: text("model_pattern").notNull(),
  inputPerMtok: real("input_per_mtok").notNull(),
  outputPerMtok: real("output_per_mtok").notNull(),
  cacheReadPerMtok: real("cache_read_per_mtok").notNull(),
  cacheCreationPerMtok: real("cache_creation_per_mtok").notNull(),
  effectiveDate: text("effective_date").notNull(),
  source: text("source").default("anthropic_public_pricing"),
})

// ─── Tabelas BetterAuth ────────────────────────────────────────────────────
// Nota: as tabelas legadas (customers, token_usage, etc.) armazenam timestamps
// como text (ISO-8601). As tabelas BetterAuth usam integer({ mode: "timestamp" })
// (Unix epoch em ms). Manter consistência ao adicionar novas colunas de data.

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  customerId: integer("customer_id").references(() => customers.id),
})

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
})
