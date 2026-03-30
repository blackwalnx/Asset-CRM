import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import contactsRouter from "./contacts";
import interactionsRouter from "./interactions";
import usersRouter from "./users";
import dashboardRouter from "./dashboard";
import auditRouter from "./audit";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(contactsRouter);
router.use(interactionsRouter);
router.use(usersRouter);
router.use(dashboardRouter);
router.use(auditRouter);

export default router;
