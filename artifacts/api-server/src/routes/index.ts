import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import proposalsRouter from "./proposals.js";
import documentsRouter from "./documents.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(proposalsRouter);
router.use(documentsRouter);

export default router;
