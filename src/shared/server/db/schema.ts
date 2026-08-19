import { pgTable, uuid, text, boolean, timestamp, jsonb, primaryKey } from 'drizzle-orm/pg-core'

// A company is the tenant. Users belong to one company and share its workspace.
export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  // Lowercased/trimmed name used to match users to an existing company at signup.
  normalizedName: text('normalized_name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  // Stored lowercased; unique across the whole app.
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
})

// Per-company key -> JSON store. Mirrors the old localStorage shape so every
// editable surface (settings, analyses, registry, availability, branding...)
// becomes shared across a company's users with no per-feature table.
export const companyState = pgTable(
  'company_state',
  {
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    value: jsonb('value').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.companyId, t.key] }),
  }),
)

export type Company = typeof companies.$inferSelect
export type User = typeof users.$inferSelect
