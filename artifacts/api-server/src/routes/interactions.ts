import { Router, type IRouter, type Request, type Response } from "express";
import { db, interactionsTable, contactsTable, auditLogsTable } from "@workspace/db";
import { eq, and, desc, lte, isNotNull } from "drizzle-orm";

const router: IRouter = Router();

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

function formatInteraction(i: typeof interactionsTable.$inferSelect, contactName?: string | null) {
  return {
    ...i,
    contactName: contactName ?? null,
    date: i.date instanceof Date ? i.date.toISOString() : i.date,
    followUpDate: i.followUpDate instanceof Date ? i.followUpDate.toISOString() : (i.followUpDate ?? null),
    createdAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : i.createdAt,
  };
}

router.get("/interactions", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { contact_id, follow_up_required, overdue } = req.query;

  const rows = await db
    .select({
      interaction: interactionsTable,
      contactName: contactsTable.fullName,
    })
    .from(interactionsTable)
    .leftJoin(contactsTable, eq(interactionsTable.contactId, contactsTable.id))
    .orderBy(desc(interactionsTable.date));

  let filtered = rows;

  if (contact_id) {
    filtered = filtered.filter((r) => r.interaction.contactId === contact_id);
  }

  if (follow_up_required === "true") {
    filtered = filtered.filter((r) => r.interaction.followUpRequired);
  }

  if (overdue === "true") {
    const now = new Date();
    filtered = filtered.filter(
      (r) =>
        r.interaction.followUpRequired &&
        r.interaction.followUpDate &&
        new Date(r.interaction.followUpDate) < now,
    );
  }

  const interactions = filtered.map((r) =>
    formatInteraction(r.interaction, r.contactName),
  );

  res.json({ interactions });
});

router.post("/interactions", async (req: Request, res: Response) => {
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
    contactId, date, engagementType, policyDomain, outcome,
    followUpRequired, followUpDate, sensitivityFlag, notes,
  } = req.body;

  if (!contactId || !date || !engagementType || !policyDomain || !outcome) {
    res.status(400).json({ error: "contactId, date, engagementType, policyDomain, and outcome are required" });
    return;
  }

  const [contact] = await db
    .select({ id: contactsTable.id, name: contactsTable.fullName })
    .from(contactsTable)
    .where(eq(contactsTable.id, contactId));

  if (!contact) {
    res.status(400).json({ error: "Contact not found" });
    return;
  }

  const [interaction] = await db
    .insert(interactionsTable)
    .values({
      contactId,
      date: new Date(date),
      engagementType,
      policyDomain,
      outcome,
      followUpRequired: followUpRequired ?? false,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      sensitivityFlag: sensitivityFlag ?? false,
      notes: notes ?? null,
      createdBy: req.user?.email ?? null,
    })
    .returning();

  await updateEngagementScore(contactId);
  await logAudit(req.user?.email, "create_interaction", "interaction", interaction.id, `Contact: ${contact.name}`);

  res.status(201).json(formatInteraction(interaction, contact.name));
});

router.get("/interactions/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;
  const [row] = await db
    .select({
      interaction: interactionsTable,
      contactName: contactsTable.fullName,
    })
    .from(interactionsTable)
    .leftJoin(contactsTable, eq(interactionsTable.contactId, contactsTable.id))
    .where(eq(interactionsTable.id, id));

  if (!row) {
    res.status(404).json({ error: "Interaction not found" });
    return;
  }

  res.json(formatInteraction(row.interaction, row.contactName));
});

router.put("/interactions/:id", async (req: Request, res: Response) => {
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
    .from(interactionsTable)
    .where(eq(interactionsTable.id, id));

  if (!existing) {
    res.status(404).json({ error: "Interaction not found" });
    return;
  }

  const updates: Record<string, unknown> = {};
  const allowed = ["date", "engagementType", "policyDomain", "outcome", "followUpRequired", "followUpDate", "sensitivityFlag", "notes"];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      if (key === "date" || key === "followUpDate") {
        updates[key] = req.body[key] ? new Date(req.body[key]) : null;
      } else {
        updates[key] = req.body[key];
      }
    }
  }

  const [updated] = await db
    .update(interactionsTable)
    .set(updates)
    .where(eq(interactionsTable.id, id))
    .returning();

  await logAudit(req.user?.email, "update_interaction", "interaction", id);

  res.json(formatInteraction(updated));
});

export default router;
