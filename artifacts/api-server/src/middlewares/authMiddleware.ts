import { type Request, type Response, type NextFunction } from "express";
import type { AuthUser } from "@workspace/api-zod";
import { db, crmRolesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  clearSession,
  getSessionId,
  getSession,
} from "../lib/auth";

export interface CrmUser extends AuthUser {
  role: string;
  status: string;
}

declare global {
  namespace Express {
    interface User extends CrmUser {}

    interface Request {
      isAuthenticated(): this is AuthedRequest;

      user?: User | undefined;
    }

    export interface AuthedRequest {
      user: User;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request["isAuthenticated"];

  const sid = getSessionId(req);
  if (!sid) {
    next();
    return;
  }

  const session = await getSession(sid);
  if (!session?.user?.id) {
    await clearSession(res, sid);
    next();
    return;
  }

  const [roleRow] = await db
    .select()
    .from(crmRolesTable)
    .where(eq(crmRolesTable.userId, session.user.id));

  req.user = {
    ...session.user,
    role: roleRow?.role ?? "viewer",
    status: roleRow?.status ?? "active",
  };

  next();
}
