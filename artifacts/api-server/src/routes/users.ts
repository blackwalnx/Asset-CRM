import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, crmRolesTable, auditLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const VALID_ROLES = ["super_admin", "admin", "fellow", "associate", "contributor", "viewer"];

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

router.get("/users", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const role = req.user?.role;
  if (role !== "super_admin" && role !== "admin") {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
      createdAt: usersTable.createdAt,
      role: crmRolesTable.role,
      status: crmRolesTable.status,
    })
    .from(usersTable)
    .leftJoin(crmRolesTable, eq(usersTable.id, crmRolesTable.userId));

  const users = rows.map((u) => ({
    ...u,
    role: u.role ?? "viewer",
    status: u.status ?? "active",
    createdAt: u.createdAt.toISOString(),
  }));

  res.json({ users });
});

router.get("/users/me", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [roleRow] = await db
    .select()
    .from(crmRolesTable)
    .where(eq(crmRolesTable.userId, req.user!.id));

  res.json({
    ...req.user,
    role: roleRow?.role ?? "viewer",
    status: roleRow?.status ?? "active",
  });
});

router.put("/users/:id/role", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const callerRole = req.user?.role;
  if (callerRole !== "super_admin" && callerRole !== "admin") {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  const { id } = req.params;
  const { role, status } = req.body;

  if (!role || !VALID_ROLES.includes(role)) {
    res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` });
    return;
  }

  if (callerRole === "admin" && role === "super_admin") {
    res.status(403).json({ error: "Only super_admin can assign super_admin role" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [existingRole] = await db
    .select()
    .from(crmRolesTable)
    .where(eq(crmRolesTable.userId, id));

  if (existingRole) {
    await db
      .update(crmRolesTable)
      .set({
        role,
        status: status ?? existingRole.status,
      })
      .where(eq(crmRolesTable.userId, id));
  } else {
    await db.insert(crmRolesTable).values({
      userId: id,
      role,
      status: status ?? "active",
    });
  }

  await logAudit(req.user?.email, "update_user_role", "user", id, `Role: ${role}`);

  const [updatedRole] = await db
    .select()
    .from(crmRolesTable)
    .where(eq(crmRolesTable.userId, id));

  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    role: updatedRole?.role ?? role,
    status: updatedRole?.status ?? "active",
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
