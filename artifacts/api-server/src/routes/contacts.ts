import { Router, type IRouter, type Request, type Response } from "express";
import { db, contactsTable, interactionsTable, auditLogsTable } from "@workspace/db";
import { eq, and, ilike, or, desc, sql, isNull, lte } from "drizzle-orm";

const router: IRouter = Router();

const CATEGORIES = ["Academic", "Civil Society", "Corporate", "Diplomat", "Government", "Journalist", "Other"];

async function generateContactId(category: string): Promise<string> {
  const prefix = (category || "OTH").slice(0, 3).toUpperCase();
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(contactsTable);
  const count = Number(result[0].count) + 1;
  return `${prefix}-${String(count).padStart(4, "0")}`;
}

async function logAudit(
  userEmail: string | null | undefined,
  action: string,
  entityType: string,
  entityId: string | null | undefined,
  details?: string,
) {
  await db.insert(auditLogsTable).values({
    userEmail: userEmail ?? null,
    action,
    entityType,
    entityId: entityId ?? null,
    details: details ?? null,
  });
}

async function updateEngagementScore(contactId: string) {
  const interactions = await db
    .select()
    .from(interactionsTable)
    .where(eq(interactionsTable.contactId, contactId));

  const count = interactions.length;
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const recencyScore = interactions.filter(
    (i) => now - new Date(i.date).getTime() < thirtyDaysMs,
  ).length;

  const score = count + recencyScore * 2;

  await db
    .update(contactsTable)
    .set({ engagementScore: score })
    .where(eq(contactsTable.id, contactId));
}

router.get("/contacts", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { search, category, sector, relationship_level, archived } = req.query;

  let query = db.select().from(contactsTable).$dynamic();

  const conditions = [];

  if (archived === "true") {
    conditions.push(eq(contactsTable.archived, true));
  } else {
    conditions.push(eq(contactsTable.archived, false));
  }

  if (search) {
    const s = `%${search}%`;
    conditions.push(
      or(
        ilike(contactsTable.fullName, s),
        ilike(contactsTable.organization, s),
        ilike(contactsTable.officialEmail, s),
        ilike(contactsTable.contactId, s),
      ),
    );
  }

  if (category) conditions.push(eq(contactsTable.category, category as string));
  if (sector) conditions.push(eq(contactsTable.sector, sector as string));
  if (relationship_level)
    conditions.push(eq(contactsTable.relationshipLevel, relationship_level as string));

  const contacts = await query
    .where(and(...conditions))
    .orderBy(desc(contactsTable.updatedAt));

  const isAdmin =
    req.user?.role === "super_admin" || req.user?.role === "admin";

  const masked = contacts.map((c) => ({
    ...c,
    confidentialNotes: isAdmin ? c.confidentialNotes : null,
    lastVerifiedDate: c.lastVerifiedDate?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  res.json({ contacts: masked });
});

router.post("/contacts/submit", async (req: Request, res: Response) => {
  const { fullName, designation, organization, officialEmail, phone, city, state, notes, policyDomains } = req.body;

  if (!fullName || !organization || !officialEmail) {
    res.status(400).json({ error: "fullName, organization, and officialEmail are required" });
    return;
  }

  const existing = await db
    .select({ id: contactsTable.id })
    .from(contactsTable)
    .where(eq(contactsTable.officialEmail, officialEmail));

  if (existing.length > 0) {
    res.status(409).json({ error: "A contact with this email already exists" });
    return;
  }

  const contactId = await generateContactId("OTH");

  await db.insert(contactsTable).values({
    contactId,
    fullName,
    designation: designation || null,
    category: "Other",
    organization,
    sector: "Public",
    officialEmail,
    phone: phone || null,
    city: city || "",
    state: state || "",
    relationshipLevel: "Cold",
    sensitivityLevel: "Public",
    notes: notes || null,
    policyDomains: policyDomains || [],
  });

  await logAudit(null, "submit_contact", "contact", null, `Submitted by: ${officialEmail}`);

  res.status(201).json({ success: true });
});

router.post("/contacts", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const role = req.user?.role;
  if (role === "viewer") {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  const {
    fullName, designation, category, organization, sector, officialEmail,
    personalEmail, phone, city, state, relationshipLevel, sensitivityLevel,
    notes, confidentialNotes, policyDomains,
  } = req.body;

  if (!fullName || !organization || !officialEmail) {
    res.status(400).json({ error: "fullName, organization, and officialEmail are required" });
    return;
  }

  const existing = await db
    .select({ id: contactsTable.id })
    .from(contactsTable)
    .where(eq(contactsTable.officialEmail, officialEmail));

  if (existing.length > 0) {
    res.status(409).json({ error: "A contact with this email already exists" });
    return;
  }

  const contactId = await generateContactId(category || "Other");

  const [contact] = await db
    .insert(contactsTable)
    .values({
      contactId,
      fullName,
      designation: designation || null,
      category: category || "Other",
      organization,
      sector: sector || "Public",
      officialEmail,
      personalEmail: personalEmail || null,
      phone: phone || null,
      city: city || "",
      state: state || "",
      relationshipLevel: relationshipLevel || "Cold",
      sensitivityLevel: sensitivityLevel || "Public",
      notes: notes || null,
      confidentialNotes: confidentialNotes || null,
      policyDomains: policyDomains || [],
    })
    .returning();

  await logAudit(req.user?.email, "create_contact", "contact", contact.id, contact.fullName);

  res.status(201).json({
    ...contact,
    lastVerifiedDate: contact.lastVerifiedDate?.toISOString() ?? null,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  });
});

router.get("/contacts/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;
  const [contact] = await db
    .select()
    .from(contactsTable)
    .where(eq(contactsTable.id, id));

  if (!contact) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }

  const isAdmin = req.user?.role === "super_admin" || req.user?.role === "admin";

  res.json({
    ...contact,
    confidentialNotes: isAdmin ? contact.confidentialNotes : null,
    lastVerifiedDate: contact.lastVerifiedDate?.toISOString() ?? null,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  });
});

router.put("/contacts/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const role = req.user?.role;
  if (role === "viewer" || role === "contributor") {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  const { id } = req.params;
  const [existing] = await db
    .select()
    .from(contactsTable)
    .where(eq(contactsTable.id, id));

  if (!existing) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }

  const updates: Record<string, unknown> = {};
  const allowed = [
    "fullName", "designation", "category", "organization", "sector",
    "officialEmail", "personalEmail", "phone", "city", "state",
    "relationshipLevel", "sensitivityLevel", "lastVerifiedDate",
    "notes", "policyDomains", "archived",
  ];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      if (key === "lastVerifiedDate") {
        updates[key] = req.body[key] ? new Date(req.body[key]) : null;
      } else {
        updates[key] = req.body[key];
      }
    }
  }

  const isAdmin = role === "super_admin" || role === "admin";
  if (isAdmin && req.body.confidentialNotes !== undefined) {
    updates["confidentialNotes"] = req.body.confidentialNotes;
  }

  const [updated] = await db
    .update(contactsTable)
    .set(updates)
    .where(eq(contactsTable.id, id))
    .returning();

  await logAudit(req.user?.email, "update_contact", "contact", id, existing.fullName);

  res.json({
    ...updated,
    lastVerifiedDate: updated.lastVerifiedDate?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

router.delete("/contacts/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const role = req.user?.role;
  if (role !== "super_admin" && role !== "admin") {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  const { id } = req.params;
  const [existing] = await db
    .select()
    .from(contactsTable)
    .where(eq(contactsTable.id, id));

  if (!existing) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }

  await db
    .update(contactsTable)
    .set({ archived: true })
    .where(eq(contactsTable.id, id));

  await logAudit(req.user?.email, "archive_contact", "contact", id, existing.fullName);

  res.json({ success: true });
});

export default router;
