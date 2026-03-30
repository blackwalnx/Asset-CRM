import { Router, type IRouter, type Request, type Response } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/audit", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const role = req.user?.role;
  if (role !== "super_admin" && role !== "admin") {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  const limit = Math.min(Number(req.query.limit) || 100, 500);

  const logs = await db
    .select()
    .from(auditLogsTable)
    .orderBy(desc(auditLogsTable.timestamp))
    .limit(limit);

  res.json({
    logs: logs.map((l) => ({
      ...l,
      timestamp: l.timestamp.toISOString(),
    })),
  });
});

export default router;
