import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contactsTable = pgTable(
  "contacts",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    contactId: varchar("contact_id").notNull().unique(),
    fullName: varchar("full_name").notNull(),
    designation: varchar("designation"),
    category: varchar("category").notNull().default("Other"),
    organization: varchar("organization").notNull(),
    sector: varchar("sector").notNull().default("Public"),
    officialEmail: varchar("official_email").notNull(),
    personalEmail: varchar("personal_email"),
    phone: varchar("phone"),
    city: varchar("city").notNull(),
    state: varchar("state").notNull(),
    relationshipLevel: varchar("relationship_level").notNull().default("Cold"),
    sensitivityLevel: varchar("sensitivity_level").notNull().default("Public"),
    lastVerifiedDate: timestamp("last_verified_date", { withTimezone: true }),
    notes: text("notes"),
    confidentialNotes: text("confidential_notes"),
    policyDomains: jsonb("policy_domains")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    engagementScore: integer("engagement_score").notNull().default(0),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_contacts_email").on(table.officialEmail),
    index("idx_contacts_category").on(table.category),
    index("idx_contacts_archived").on(table.archived),
  ],
);

export const insertContactSchema = createInsertSchema(contactsTable).omit({
  id: true,
  contactId: true,
  engagementScore: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contactsTable.$inferSelect;

export const interactionsTable = pgTable(
  "interactions",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    contactId: varchar("contact_id").notNull(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    engagementType: varchar("engagement_type").notNull(),
    policyDomain: varchar("policy_domain").notNull(),
    outcome: text("outcome").notNull(),
    followUpRequired: boolean("follow_up_required").notNull().default(false),
    followUpDate: timestamp("follow_up_date", { withTimezone: true }),
    sensitivityFlag: boolean("sensitivity_flag").notNull().default(false),
    notes: text("notes"),
    createdBy: varchar("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_interactions_contact").on(table.contactId),
    index("idx_interactions_date").on(table.date),
    index("idx_interactions_follow_up").on(table.followUpDate),
  ],
);

export const insertInteractionSchema = createInsertSchema(
  interactionsTable,
).omit({
  id: true,
  createdAt: true,
});
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type Interaction = typeof interactionsTable.$inferSelect;

export const crmRolesTable = pgTable("crm_roles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  role: varchar("role").notNull().default("viewer"),
  status: varchar("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type CrmRole = typeof crmRolesTable.$inferSelect;

export const auditLogsTable = pgTable(
  "audit_logs",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userEmail: varchar("user_email"),
    action: varchar("action").notNull(),
    entityType: varchar("entity_type").notNull(),
    entityId: varchar("entity_id"),
    details: text("details"),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_audit_timestamp").on(table.timestamp),
    index("idx_audit_entity").on(table.entityType, table.entityId),
  ],
);

export type AuditLog = typeof auditLogsTable.$inferSelect;
