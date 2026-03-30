import { Router, type IRouter, type Request, type Response } from "express";
import { db, contactsTable, interactionsTable, auditLogsTable } from "@workspace/db";
import { eq, sql, desc, and, lte } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [totalContactsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contactsTable)
    .where(eq(contactsTable.archived, false));
  const totalContacts = Number(totalContactsResult.count);

  const [totalInteractionsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(interactionsTable);
  const totalInteractions = Number(totalInteractionsResult.count);

  const now = new Date();
  const overdueRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(interactionsTable)
    .where(
      and(
        eq(interactionsTable.followUpRequired, true),
        sql`${interactionsTable.followUpDate} IS NOT NULL`,
        sql`${interactionsTable.followUpDate} < ${now}`,
      ),
    );
  const overdueFollowUps = Number(overdueRows[0].count);

  const contactsByCategory = await db
    .select({
      category: contactsTable.category,
      count: sql<number>`count(*)`,
    })
    .from(contactsTable)
    .where(eq(contactsTable.archived, false))
    .groupBy(contactsTable.category)
    .orderBy(desc(sql`count(*)`));

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const interactionsByMonth = await db.execute(sql`
    SELECT
      TO_CHAR(date_trunc('month', date), 'Mon YYYY') as month,
      COUNT(*) as count
    FROM interactions
    WHERE date >= ${sixMonthsAgo}
    GROUP BY date_trunc('month', date)
    ORDER BY date_trunc('month', date) ASC
  `);

  const relationshipBreakdown = await db
    .select({
      level: contactsTable.relationshipLevel,
      count: sql<number>`count(*)`,
    })
    .from(contactsTable)
    .where(eq(contactsTable.archived, false))
    .groupBy(contactsTable.relationshipLevel);

  const oneEightyDaysAgo = new Date();
  oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);
  const [agingContactsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contactsTable)
    .where(
      and(
        eq(contactsTable.archived, false),
        sql`${contactsTable.updatedAt} < ${oneEightyDaysAgo}`,
      ),
    );
  const agingContacts = Number(agingContactsResult.count);

  const recentAuditLogs = await db
    .select()
    .from(auditLogsTable)
    .orderBy(desc(auditLogsTable.timestamp))
    .limit(10);

  res.json({
    totalContacts,
    totalInteractions,
    overdueFollowUps,
    contactsByCategory: contactsByCategory.map((c) => ({
      category: c.category,
      count: Number(c.count),
    })),
    interactionsByMonth: (interactionsByMonth.rows as { month: string; count: string }[]).map((r) => ({
      month: r.month,
      count: Number(r.count),
    })),
    relationshipBreakdown: relationshipBreakdown.map((r) => ({
      level: r.level,
      count: Number(r.count),
    })),
    agingContacts,
    recentActivity: recentAuditLogs.map((l) => ({
      id: l.id,
      action: l.action,
      timestamp: l.timestamp.toISOString(),
      user: l.userEmail,
    })),
  });
});

export default router;
